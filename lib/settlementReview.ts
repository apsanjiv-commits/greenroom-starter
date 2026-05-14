/**
 * Settlement review helper for guarantee versus net deals.
 *
 * This module encapsulates the logic needed to parse free‑form deal notes,
 * compute guarantee and net payouts from ticket revenue, expenses and recoups,
 * raise risk flags for inconsistent data and generate human friendly
 * explanations.  It deliberately handles only standard guarantee‑vs‑net deals
 * (no tiered percentages, pots or ratchets).  Each function is pure and
 * suitable for unit testing.
 */

export interface DealParsed {
  /** Guarantee amount in dollars. */
  guarantee: number | null;
  /** Percentage of net after expenses, expressed as a decimal (e.g. 0.8 for 80%). */
  percentage: number | null;
  /** Raw notes used to compute the deal, for auditing. */
  rawNotes: string;
  /** Any parse warnings. */
  warnings: string[];
}

/**
 * Basic parser to extract a guarantee and percentage from a free‑text notes field.
 *
 * The parser looks for patterns like `$5,000`, `5000`, `5k`, `80%` and returns
 * the first plausible match.  It falls back to the structured fields passed
 * as optional parameters when no pattern is found.  It also collects
 * warnings when multiple conflicting values are found.
 */
export function parseVsDeal(
  notes: string,
  guaranteeFromFields?: number | null,
  percentageFromFields?: number | null
): DealParsed {
  const warnings: string[] = [];
  let guarantee: number | null = null;
  let percentage: number | null = null;

  // Normalize notes: remove commas and convert to lower case for easier matching
  const normalized = notes.replace(/,/g, '').toLowerCase();

  // Match guarantee patterns like "$5000", "5k" or "5000"
  const guarMatch = normalized.match(/\$?(\d+(?:\.\d+)?)(k)?/);
  if (guarMatch) {
    const value = parseFloat(guarMatch[1]);
    guarantee = guarMatch[2] === 'k' ? value * 1000 : value;
  }

  // Match percentage patterns like "80%" or "0.8"
  const percMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percMatch) {
    const value = parseFloat(percMatch[1]);
    percentage = value > 1 ? value / 100 : value;
  }

  // Fall back to structured fields if nothing found
  if (guarantee === null && guaranteeFromFields != null) {
    guarantee = guaranteeFromFields;
  }
  if (percentage === null && percentageFromFields != null) {
    percentage = percentageFromFields;
  }

  // Warn if both notes and structured fields exist but disagree
  if (
    guarantee !== null &&
    guaranteeFromFields != null &&
    Math.abs(guarantee - guaranteeFromFields) > 0.01
  ) {
    warnings.push(
      `Guarantee mismatch between notes ($${guarantee}) and structured field ($${guaranteeFromFields})`
    );
  }
  if (
    percentage !== null &&
    percentageFromFields != null &&
    Math.abs(percentage - percentageFromFields) > 0.0001
  ) {
    warnings.push(
      `Percentage mismatch between notes (${percentage * 100}%) and structured field (${percentageFromFields * 100}%)`
    );
  }

  return {
    guarantee,
    percentage,
    rawNotes: notes,
    warnings,
  };
}

export interface ExpenseLine {
  category: string;
  amount: number;
}

export interface RecoupLine {
  category: string;
  amount: number;
  status: 'agreed' | 'disputed' | 'withdrawn';
}

export interface SettlementContext {
  gross: number;
  expenses: ExpenseLine[];
  recoups: RecoupLine[];
}

export interface ReviewResult {
  guarantee: number;
  netAfterExpenses: number;
  netAfterRecoups: number;
  chosenPayout: number;
  chosenBasis: 'guarantee' | 'net';
  breakdown: {
    gross: number;
    expensesTotal: number;
    recoupsTotal: number;
    recoupsDisputed: number;
  };
  flags: string[];
}

/**
 * Compute the guarantee vs net payout and raise flags when something
 * appears risky.  Assumes deal.percentage and deal.guarantee are defined.
 */
export function reviewSettlement(
  deal: DealParsed,
  context: SettlementContext
): ReviewResult {
  const flags: string[] = [];

  if (deal.guarantee == null || deal.percentage == null) {
    flags.push('Deal lacks guarantee or percentage');
    return {
      guarantee: deal.guarantee ?? 0,
      netAfterExpenses: 0,
      netAfterRecoups: 0,
      chosenPayout: deal.guarantee ?? 0,
      chosenBasis: 'guarantee',
      breakdown: {
        gross: context.gross,
        expensesTotal: 0,
        recoupsTotal: 0,
        recoupsDisputed: 0,
      },
      flags,
    };
  }

  const expensesTotal = context.expenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );
  const recoupsTotal = context.recoups.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );
  const recoupsDisputed = context.recoups.reduce(
    (sum, r) => (r.status === 'disputed' ? sum + (r.amount || 0) : sum),
    0
  );

  // Net after expenses
  const netAfterExpenses = (context.gross - expensesTotal) * deal.percentage;
  // Net after expenses and recoups (assuming recoups reduce artist payout)
  const netAfterRecoups = netAfterExpenses - recoupsTotal;

  let chosenPayout = deal.guarantee;
  let chosenBasis: 'guarantee' | 'net' = 'guarantee';
  if (netAfterRecoups > deal.guarantee) {
    chosenPayout = netAfterRecoups;
    chosenBasis = 'net';
  }

  // Add warnings about disputed recoups
  if (recoupsDisputed > 0) {
    flags.push(
      `There are disputed recoups totaling $${recoupsDisputed.toFixed(2)}`
    );
  }
  // Propagate warnings from the parse stage
  flags.push(...deal.warnings);

  return {
    guarantee: deal.guarantee,
    netAfterExpenses,
    netAfterRecoups,
    chosenPayout,
    chosenBasis,
    breakdown: {
      gross: context.gross,
      expensesTotal,
      recoupsTotal,
      recoupsDisputed,
    },
    flags,
  };
}

/**
 * Generate a human friendly note to send to the tour manager explaining how we
 * arrived at the payout.  The note is intentionally conservative and can be
 * edited by the booker before sending.
 */
export function generateTMNote(result: ReviewResult, deal: DealParsed): string {
  const parts: string[] = [];
  parts.push(
    `Guarantee of $${(deal.guarantee ?? 0).toLocaleString()} vs ${
      (deal.percentage ?? 0) * 100
    }% of net.`
  );
  if (result.chosenBasis === 'net') {
    parts.push(
      `Net wins. Gross revenue $${result.breakdown.gross.toLocaleString()} minus expenses of $${result.breakdown.expensesTotal.toLocaleString()} = net after expenses of $${result.netAfterExpenses.toLocaleString()}.`
    );
    if (result.breakdown.recoupsTotal > 0) {
      parts.push(
        `Recoups of $${result.breakdown.recoupsTotal.toLocaleString()} applied.`
      );
    }
    parts.push(
      `Final payout to artist: $${result.chosenPayout.toLocaleString()}.`
    );
  } else {
    parts.push(
      `Guarantee wins. Net after expenses and recoups was $${result.netAfterRecoups.toLocaleString()}.`
    );
    parts.push(
      `Final payout to artist: $${result.chosenPayout.toLocaleString()}.`
    );
  }
  if (result.flags.length) {
    parts.push(`\nPlease review: ${result.flags.join('; ')}`);
  }
  return parts.join(' ');
}