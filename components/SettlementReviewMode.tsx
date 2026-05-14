import React, { useMemo, useState } from 'react';
import { parseVsDeal, reviewSettlement, generateTMNote, SettlementContext, DealParsed, ReviewResult } from '../../lib/settlementReview';

/**
 * Props for the SettlementReviewMode component.  It expects a settlement record
 * with gross, expenses, recoups and a free‑form notes field.  In the real
 * application these would be derived from the database; for the case study
 * prototype we define the minimal shape here.
 */
export interface SettlementReviewProps {
  /** Gross ticket revenue for the show. */
  gross: number;
  /** Structured list of expenses. */
  expenses: { category: string; amount: number }[];
  /** Structured recoup line items. */
  recoups: { category: string; amount: number; status: 'agreed' | 'disputed' | 'withdrawn' }[];
  /** Free‑text notes describing the deal. */
  notes_freetext: string;
  /** Structured guarantee value, if available. */
  guarantee_amount?: number | null;
  /** Structured percentage value, if available. */
  percentage?: number | null;
}

/**
 * Presentational component that renders a review pane for Vs deals.
 */
export const SettlementReviewMode: React.FC<SettlementReviewProps> = (
  props
) => {
  const deal: DealParsed = useMemo(() => {
    return parseVsDeal(
      props.notes_freetext || '',
      props.guarantee_amount ?? null,
      props.percentage ?? null
    );
  }, [props.notes_freetext, props.guarantee_amount, props.percentage]);

  const context: SettlementContext = useMemo(() => {
    return {
      gross: props.gross,
      expenses: props.expenses.map((e) => ({ category: e.category, amount: e.amount })),
      recoups: props.recoups.map((r) => ({ category: r.category, amount: r.amount, status: r.status })),
    };
  }, [props.gross, props.expenses, props.recoups]);

  const review: ReviewResult = useMemo(() => {
    return reviewSettlement(deal, context);
  }, [deal, context]);

  const [note, setNote] = useState<string>(() => generateTMNote(review, deal));

  // When the review result changes, regenerate the note
  React.useEffect(() => {
    setNote(generateTMNote(review, deal));
  }, [review, deal]);

  return (
    <div className="p-4 bg-white border-l border-gray-200 w-full max-w-xl overflow-y-auto">
      <h2 className="text-xl font-semibold mb-2">Settlement Review</h2>
      <section className="mb-4">
        <h3 className="font-semibold">Payout comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-1">Basis</th>
              <th className="py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className={review.chosenBasis === 'guarantee' ? 'font-bold' : ''}>
              <td className="py-1">Guarantee</td>
              <td className="py-1">${review.guarantee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr className={review.chosenBasis === 'net' ? 'font-bold' : ''}>
              <td className="py-1">Net after recoups</td>
              <td className="py-1">${review.netAfterRecoups.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="mb-4">
        <h3 className="font-semibold">Breakdown</h3>
        <ul className="list-disc pl-5 text-sm">
          <li>Gross revenue: ${review.breakdown.gross.toLocaleString()}</li>
          <li>Expenses total: ${review.breakdown.expensesTotal.toLocaleString()}</li>
          <li>Recoups total: ${review.breakdown.recoupsTotal.toLocaleString()}</li>
          {review.breakdown.recoupsDisputed > 0 && (
            <li className="text-red-600">Disputed recoups: ${review.breakdown.recoupsDisputed.toLocaleString()}</li>
          )}
        </ul>
      </section>
      {review.flags.length > 0 && (
        <section className="mb-4">
          <h3 className="font-semibold text-red-700">Warnings</h3>
          <ul className="list-disc pl-5 text-sm text-red-600">
            {review.flags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="mb-2">
        <h3 className="font-semibold">Tour Manager Note</h3>
        <textarea
          className="w-full border border-gray-300 rounded p-2 text-sm"
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </section>
      <p className="text-xs text-gray-500">Edit the note above before copying it to your email. The note will be saved with the settlement when submitted.</p>
    </div>
  );
};

export default SettlementReviewMode;