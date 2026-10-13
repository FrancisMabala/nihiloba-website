from pathlib import Path

p = Path(r'C:\NIHILOBA\Backend\tests\test_restaurant_pos.py')
s = p.read_text(encoding='utf-8')
old = "\n\n@pytest.mark.usefixtures(\"restaurant_commercial_transition\")\ndef test_counter_handoff_uses_one_canonical_money_bill(http):"
new = """

def test_pre_purchase_owner_can_use_existing_finances(setup_order):
    s = setup_order
    assert pos.workspace(**scope(s))['items']
    method = money.configure_method(**scope(s), label='Cash', kind='cash',
        currencies=['CDF', 'USD'], enabled=True)
    assert method['method_ref'] in {item['method_ref'] for item in money.methods(**scope(s))['items']}
    daily.confirm_time_zone(**scope(s), time_zone='UTC', expected_revision=0,
        operation_key='prepurchase-finance-zone', confirm=True)
    report = daily.preview(**scope(s), local_date='2026-09-10')
    assert report['bill_summary']['CDF'] == {'order_value': '0.00', 'recorded_collections': '0.00'}
    assert report['bill_summary']['USD'] == {'order_value': '0.00', 'recorded_collections': '0.00'}


@pytest.mark.usefixtures("restaurant_commercial_transition")
def test_counter_handoff_uses_one_canonical_money_bill(http):"""
assert old in s
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
