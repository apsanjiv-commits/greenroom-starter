# Loom Walkthrough Script – Settlement Review Mode

> **Note**: Record at 1× speed with pauses so viewers can follow along.  Feel free to improvise but keep the narrative focused on the problem, the chosen slice, and the solution.  Aim for 5–7 minutes.

## Opening (0:00–0:30)

- Introduce yourself briefly.  
- Explain that you’ll walk through the Greenroom case study focusing on the highest‑impact settlement slice.  
- State that you selected standard Vs deals because data and interviews show they are common and painful.

## Problem & Data (0:30–1:30)

- Describe how settlement works today: after each show, tour managers like Mariana reconcile gross, expenses and recoups.  Greenroom’s current calculator only supports flat and percentage‑of‑gross deals.  Most Vs and net deals are handled in spreadsheets.  
- Share the data findings: 537 settlements in the database; only 203 use supported deal types; 195 are Vs deals, 109 percentage‑of‑net.  Recoups are messy: 103 line items, 24 disputed, 13 disputed on Vs deals.  Highlight that 192 out of 195 Vs settlements have sign‑off notes, showing how important conversation is.  
- Emphasize that we cut the problem down to “standard” Vs deals, roughly 104 rows, excluding walk‑outs, pots, tier escalators and gross‑basis variants.

## Demo Setup (1:30–2:00)

- Navigate to the Greenroom starter app you cloned and note that a new route `/case-study` has been added.  Explain that this is a temporary demo page; in production the review mode will live inside the existing settlement flow.

## Calculation & Breakdown (2:00–3:00)

- Click into a mocked standard Vs settlement on the `/case-study` page.  Explain that the page loads a settlement with a guarantee, gross, expenses and a recoup.  
- Show the top section where the tool parses the guarantee and percentage from the deal notes and calculates the payout.  Point out the breakdown: gross, total expenses, net, guarantee, percentage of net and which option wins.  
- Mention that the math is implemented in `lib/settlementReview.ts`, which parses free text and is extensible for other variants.

## Recoups & Flags (3:00–4:30)

- Scroll to the expense and recoup breakdown.  Explain that recoups come from the `recoups_json` in `settlements`.  Each recoup lists its category, amount and status (agreed, disputed, withdrawn).  
- Point out the red flag on the disputed marketing recoup.  Explain how the tool surfaces these issues so the TM can address them before sending the settlement.  
- Show how the tool also flags when the settlement status is `disputed` but the sign‑off note contains a positive phrase.  Mention that this simple linguistic check caught eight such cases in the database.  
- If time allows, mention that mismatches between structured deal fields and the free‑text notes (e.g. a `flat` deal with “vs net” in the notes) are also detected.

## Tour Manager Note (4:30–5:30)

- Highlight the generated tour manager note.  Explain that it summarizes the payout, lists any recoups and flags, and can be edited before sending.  This aligns with Mariana’s request for a clear paper trail.  
- Mention that while this prototype uses static copy, it could be powered by GPT for more natural language and context.

## Next Steps & Closing (5:30–6:30)

- Recap what has been built: a focused review mode for standard Vs deals that performs the math, surfaces recoups, and flags data quality issues.  
- Explain what you cut (walk‑outs, tier escalators, dispute workflows) and why.  Stress that this focus allowed you to build something real.  
- Discuss how you would validate the feature: track adoption, time to settle, dispute rates, and user feedback.  Mention potential A/B test designs.  
- Outline next steps: integrate into the real settlement flow, support more variants, and add guided dispute resolution and AI‑assisted summaries.  
- Thank the viewer and invite them to explore the branch and memo for more detail.

