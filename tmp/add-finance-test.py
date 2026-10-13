from pathlib import Path

p = Path(r'C:\NIHILOBA\Backend\tests\test_restaurant_pos.py')
s = p.read_text(encoding='utf-8')
s = s.replace('from app.services import restaurant_money_service as money\n', 'from app.services import restaurant_money_service as money\nfrom app.services import restaurant_daily_service as daily\n', 1)
old = "    assert money.receipt(**scope(s), group_ref=group_ref)['payment_verified'] is False\n"
new = old + "    daily.confirm_time_zone(**scope(s), time_zone='UTC', expected_revision=0,\n        operation_key='counter-day-zone', confirm=True)\n    local_date = datetime.fromisoformat(first['current_order']['submitted_at']).date().isoformat()\n    summary = daily.preview(**scope(s), local_date=local_date)\n    assert summary['bill_summary'][currency] == {\n        'order_value': amount, 'recorded_collections': amount}\n    assert summary['outstanding'][currency]['balance_due'] == '0.00'\n"
assert old in s
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
