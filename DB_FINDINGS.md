## Database Findings

While exploring the `greenroom.db` SQLite database I extracted key facts to ground the settlement review feature in real data.  All counts below were derived by querying the database directly using a small Python script (see `scripts/analyze_greenroom_db.py`).

- **Total settlements:** 537 rows in the `settlements` table.
- **Deal type distribution:**
  - `door`: 30 shows
  - `flat`: 185 shows
  - `percentage_of_gross`: 18 shows
  - `percentage_of_net`: 109 shows
  - `vs`: 195 shows
- **Unsupported deals:** 334 deals are not `flat` or `percentage_of_gross` and therefore are currently not handled by the existing settlement calculator.
- **Vs deals:** 195 of the 537 settlements involve a Vs deal.  After filtering out keywords associated with walk‑outs, pots, tiered escalators, ratchets or gross‑basis language there are roughly **104 “standard” Vs deals** with simple guarantee‑versus‑net structure.
- **Recoup items:** there are 103 recoup line items stored in the `recoups_json` column of the `settlements` table. 24 of these line items are marked `disputed` and 13 of those disputed recoups occur on Vs deals.  The recoups cover costs such as marketing, hospitality overages and production overages.
- **Positive sign‑off contradictions:** among Vs settlements marked `disputed`, at least eight contain a positive sign‑off phrase such as “looks good” or “sounds good.”  This mismatch between status and sign‑off text suggests data quality and workflow issues.
- **Vs settlements with sign‑offs:** 192 of the 195 Vs settlements have a non‑empty `signoff_text`, indicating that tour managers frequently leave a note even when the settlement is not finalized.

These numbers show that Vs deals are both common and messy.  They account for the largest unsupported slice of settlements and most of the disputed recoup items.  This quantitative view reinforces the qualitative feedback from users: building tooling around Vs settlements, recoup transparency and sign‑off contradictions is a high‑leverage opportunity.
