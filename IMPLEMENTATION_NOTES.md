## Implementation Notes

This file explains how the settlement review mode prototype was implemented and how to run it locally.

### File Structure

- `lib/settlementReview.ts` – Pure TypeScript library that parses a free‑text Vs deal note (e.g. “$5k vs 80% of net after expenses”), extracts the guarantee and percentage, sums expenses from the settlement record, and computes both the guarantee and net payout.  It also accepts a list of recoups and returns risk flags for disputed recoups, status/sign‑off contradictions and mismatches between structured deal fields and the free‑text notes.
- `components/settlement/SettlementReviewMode.tsx` – A React component that renders the calculation breakdown, expense and recoup lists, flags and an editable tour manager note.  It takes props matching the shape of a `settlement` record and uses the library to perform the calculations.
- `app/case‑study/page.tsx` – Temporary demo page that instantiates the review mode with mocked settlement data so reviewers can see it without navigating through the full product.  In production this mode should be integrated into the existing `/shows/[id]/settle` route.
- `DB_FINDINGS.md`, `db_facts.json` and `scripts/analyze_greenroom_db.py` – Artifacts used to analyze the provided `greenroom.db`.  These documents support the memo and are not required at runtime.
- `GREENROOM_CASE_MEMO.md` and `LOOM_SCRIPT.md` – Written deliverables for the case study.

### Running the Prototype

1. **Clone the forked repository** and check out the `sanjiv‑vs‑settlement‑review` branch.
2. Ensure Node.js 18+ is installed.  Run `npm install` in the project root.
3. Reset the development database (this will seed sample data):

   ```bash
   npm run db:reset
   ```
4. Start the development server:

   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.
5. Visit `/case‑study` to view the demo settlement review mode.
6. To test with real data, navigate to an existing show’s settle page (e.g. `/shows/show_0123/settle`) that uses a standard Vs deal.  You should see the review mode integrated into the settlement form.

### Assumptions & Limitations

- The prototype assumes expenses and recoups are stored in arrays; in the real schema recoups are stored as JSON on the settlement and expenses live in a separate table.  The component would need to be refactored to fetch this data server‑side.
- Only standard Vs deals are supported.  Deals containing words like “walkout”, “pot”, “tier”, “ratchet” or “gross” are not parsed and will fall back to existing logic.
- The sign‑off contradiction detection looks for positive phrases such as “looks good” in the `signoff_text`.  A more sophisticated approach could use a sentiment model.
- The tour manager note is a simple template.  In production we could leverage an LLM to generate more contextual language.

### How to Extend

- **Additional Deal Types:**  The parser in `settlementReview.ts` is modular.  Add new functions for walk‑out pots or tiered escalators and update the component to display additional breakdowns.
- **Inline Editing:**  Wire up expense and recoup lists to mutation endpoints so tour managers can adjust amounts directly in the review mode.
- **Dispute Workflow:**  Provide actions to mark a recoup as disputed, discuss it with the agent, and track resolution.  Surface outstanding disputes prominently before finalizing.
