from pathlib import Path

path = Path(r'C:\NIHILOBA\Backend\tests\test_restaurant_pos.py')
source = path.read_text(encoding='utf-8')
needle = 'from app.services import restaurant_fulfillment_service as f\n'
assert source.count(needle) == 1
source = source.replace(needle, needle + 'from app.services import restaurant_money_service as money\nfrom app.services import restaurant_service_group_service as groups\n')
source += '''

@pytest.mark.usefixtures("restaurant_commercial_transition")
def test_counter_handoff_uses_one_canonical_money_bill(http):
    s, client, root = http
    login(client, s['owner']['actor_account_id'])
    subscribe_current(s)
    cash = money.configure_method(**scope(s), label='Counter cash', kind='cash',
        currencies=['CDF', 'USD'], enabled=True)
    base = root + '/pos/counter-baskets'
    draft = checked(client.post(base, json={'operation_key': 'money-counter-basket'}))
    path = base + '/' + draft['basket_ref']
    quoted = checked(client.post(path + '/quote', json={
        'operation_key': 'money-counter-quote', 'expected_revision': draft['revision'],
        'selections': s['selections'], 'fulfillment_method': 'takeaway'}))['basket']
    handoff = {'operation_key': 'money-counter-handoff',
        'expected_revision': quoted['revision'], 'quote_ref': quoted['quote_ref'],
        'confirm': True, 'handoff_confirmed': True, 'fulfillment_method': 'takeaway'}
    first = checked(client.post(path + '/finalize', json=handoff))
    assert checked(client.post(path + '/finalize', json=handoff)) == first
    group_ref = first['bill_group_ref']
    assert first['operation_outcome']['bill_group_ref'] == group_ref
    order_ref = first['current_order']['order_ref']
    assert checked(client.get(root + '/orders/' + order_ref + '/receipt'))['bill_group_ref'] == group_ref
    assert checked(client.get(root + '/pos'))['recent'][0]['bill_group_ref'] == group_ref
    assert all(row['group_ref'] != group_ref for row in groups.listing(**scope(s))['items'])
    bill = money.bill(**scope(s), group_ref=group_ref)
    currency = first['current_order']['receipt_terms']['currency']
    amount = first['current_order']['receipt_terms']['order_total']
    assert bill['state'] == 'closed' and bill['payment_verified'] is False
    assert bill['currencies'][currency]['chargeable'] == amount
    assert bill['currencies'][currency]['balance_due'] == amount
    body = dict(**scope(s), group_ref=group_ref, kind='receipt',
        method_ref=cash['method_ref'], currency=currency, amount=amount,
        change_returned='0', expected_bill_revision=bill['bill_revision'],
        expected_payment_revision=bill['payment_revision'], operation_key='money-counter-receipt')
    recorded = money.write(**body)
    assert money.write(**body)['operation_outcome'] == recorded['operation_outcome']
    assert recorded['bill']['currencies'][currency]['net_allocated'] == amount
    assert recorded['bill']['currencies'][currency]['balance_due'] == '0.00'
    assert recorded['bill']['entries'][0]['method']['provider_verified'] is False
    assert money.receipt(**scope(s), group_ref=group_ref)['payment_verified'] is False
    with pytest.raises(PermissionError):
        money.bill(who=s['buyer'], establishment_ref=s['row']['public_ref'], group_ref=group_ref)
'''
path.write_text(source, encoding='utf-8')
