from pathlib import Path

p = Path('tests/browser/restaurant-workflow.browser.ts')
s = p.read_text(encoding='utf-8')
old = "outstanding:{CDF:{balance_due:'0.00',refund_owed:'0.00'},USD:{balance_due:'0.00',refund_owed:'0.00'}},open_orders:"
new = "outstanding:{CDF:{balance_due:'0.00',refund_owed:'0.00'},USD:{balance_due:'0.00',refund_owed:'0.00'}},bill_summary:{CDF:{order_value:'3000.00',recorded_collections:'3000.00'},USD:{order_value:'2.50',recorded_collections:'2.50'}},open_orders:"
assert old in s
s = s.replace(old, new, 1)
old = "await expect(page.locator('.rst-daily-summary')).toContainText('-300.00');"
new = "await expect(page.locator('.rst-daily-summary')).toContainText('-300.00');await expect(page.locator('.rst-daily-summary')).toContainText('Valeur des commandes liées');await expect(page.locator('.rst-daily-summary')).toContainText('Encaissements nets enregistrés');"
assert old in s
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
