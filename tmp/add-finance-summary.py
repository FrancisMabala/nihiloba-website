from pathlib import Path

p = Path(r'C:\NIHILOBA\Backend\app\services\restaurant_daily_service.py')
s = p.read_text(encoding='utf-8')
old = "    outstanding = {c: {'balance_due': Decimal(0), 'refund_owed': Decimal(0)} for c in money.CURRENCIES}\n    groups = db.query(Group)"
new = "    outstanding = {c: {'balance_due': Decimal(0), 'refund_owed': Decimal(0)} for c in money.CURRENCIES}\n    bill_summary = {c: {'order_value': Decimal(0), 'recorded_collections': Decimal(0)} for c in money.CURRENCIES}\n    groups = db.query(Group)"
assert old in s
s = s.replace(old, new, 1)
old = "        for currency in money.CURRENCIES:\n            for key in ('balance_due', 'refund_owed'):\n                outstanding[currency][key] += Decimal(bill['currencies'][currency][key])"
new = "        for currency in money.CURRENCIES:\n            for key in ('balance_due', 'refund_owed'):\n                outstanding[currency][key] += Decimal(bill['currencies'][currency][key])\n            bill_summary[currency]['order_value'] += Decimal(bill['currencies'][currency]['chargeable'])\n            bill_summary[currency]['recorded_collections'] += Decimal(bill['currencies'][currency]['net_allocated'])"
assert old in s
s = s.replace(old, new, 1)
old = "        'outstanding': {c: {key: money.fmt(value) for key, value in outstanding[c].items()}\n            for c in money.CURRENCIES},"
new = "        'outstanding': {c: {key: money.fmt(value) for key, value in outstanding[c].items()}\n            for c in money.CURRENCIES},\n        'bill_summary': {c: {key: money.fmt(value) for key, value in bill_summary[c].items()}\n            for c in money.CURRENCIES},"
assert old in s
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
