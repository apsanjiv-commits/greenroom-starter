"""
This script analyzes the greenroom.db database and prints summary statistics
about settlements, deal types and recoups.  It is intended to illustrate how
I extracted quantitative insights to guide the case study.

Usage: python analyze_greenroom_db.py /path/to/greenroom.db
"""
import sqlite3
import json
import sys
from pathlib import Path

def analyze(db_path: str):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    total_settlements = c.execute('SELECT COUNT(*) AS cnt FROM settlements').fetchone()[0]
    deal_counts = {row['deal_type']: row['cnt'] for row in c.execute('SELECT deal_type, COUNT(*) AS cnt FROM deals GROUP BY deal_type')}
    unsupported = sum(count for deal, count in deal_counts.items() if deal not in ('flat', 'percentage_of_gross'))
    vs_deals = deal_counts.get('vs', 0)
    # Preload deals by show_id for quick lookups
    deal_by_show = {row['show_id']: row for row in c.execute('SELECT show_id, deal_type FROM deals')}
    recoup_total = 0
    recoup_disputed = 0
    vs_recoup_disputed = 0
    vs_settlements_with_signoff = 0
    disputed_vs_with_positive_signoff = 0
    positive_phrases = ['looks good', 'sounds good', 'looks ok', 'looks fine', 'all good', 'ok']
    for settlement in c.execute('SELECT show_id, recoups_json, status, signoff_text FROM settlements'):
        show_id = settlement['show_id']
        deal_type = deal_by_show.get(show_id, {}).get('deal_type')
        # Count sign‑offs for vs settlements
        if deal_type == 'vs' and settlement['signoff_text']:
            vs_settlements_with_signoff += 1
            if settlement['status'] == 'disputed':
                text = settlement['signoff_text'].lower()
                if any(p in text for p in positive_phrases):
                    disputed_vs_with_positive_signoff += 1
        # Count recoups
        recoups_json = settlement['recoups_json']
        if recoups_json:
            recoups = json.loads(recoups_json)
            recoup_total += len(recoups)
            for recoup in recoups:
                if recoup.get('status') == 'disputed':
                    recoup_disputed += 1
                    if deal_type == 'vs':
                        vs_recoup_disputed += 1
    # Count standard vs deals (no walkout, pot, tier, ratchet or gross keywords)
    keywords = ['walkout', 'pot', 'tier', 'ratchet', 'gross']
    standard_vs = 0
    for row in c.execute('SELECT deal_type, deal_notes_freetext FROM deals'):
        if row['deal_type'] == 'vs':
            text = (row['deal_notes_freetext'] or '').lower()
            if not any(k in text for k in keywords):
                standard_vs += 1
    facts = {
        'total_settlements': total_settlements,
        'deal_counts': deal_counts,
        'unsupported_deals': unsupported,
        'vs_deals': vs_deals,
        'standard_vs_deals': standard_vs,
        'recoup_total': recoup_total,
        'recoup_disputed': recoup_disputed,
        'vs_recoup_disputed': vs_recoup_disputed,
        'vs_settlements_with_signoff': vs_settlements_with_signoff,
        'disputed_vs_with_positive_signoff': disputed_vs_with_positive_signoff,
    }
    print(json.dumps(facts, indent=2))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python analyze_greenroom_db.py /path/to/greenroom.db')
        sys.exit(1)
    db_path = sys.argv[1]
    if not Path(db_path).exists():
        print(f'Database not found: {db_path}')
        sys.exit(1)
    analyze(db_path)
