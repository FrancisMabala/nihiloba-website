from pathlib import Path

root = Path(r'C:\NIHILOBA\Backend')

def change(relative, before, after):
    path = root / relative
    source = path.read_text(encoding='utf-8')
    assert source.count(before) == 1, (relative, source.count(before), before[:100])
    path.write_text(source.replace(before, after), encoding='utf-8')

change('app/services/restaurant_service_group_service.py',
       'MAX_ROUNDS = 60\n',
       '''MAX_ROUNDS = 60


def is_counter_bill(group):
    """A closed single-handoff bill, identified without a second order or ledger."""
    return (group.visit_ref is None and group.state == 'closed' and
            group.money_opened_at is not None and
            o.menu.utc(group.order_until) == o.menu.utc(group.created_at))


def counter_handoff_bill(db, parent, order, actor_ref, at):
    """Attach one completed counter order to the existing canonical money bill."""
    if (order.entry_source != 'counter' or order.state != 'completed' or
            (order.establishment_id, order.owner_scope) != (parent.id, o._scope(db, parent)) or
            db.get(Link, order.public_ref)):
        o.fail()
    row = Group(public_ref=o.generate_public_ref('RSG'), establishment_id=parent.id,
        owner_scope=order.owner_scope, revision=1, state='open', created_at=at,
        order_until=at)
    db.add(row)
    db.flush()
    audit(db, row, 'created', actor_ref, at)
    db.add(Link(order_ref=order.public_ref, group_ref=row.public_ref, created_at=at))
    row.revision = 2
    audit(db, row, 'linked', actor_ref, at)
    row.state, row.money_opened_at, row.revision = 'checkout', at, 3
    audit(db, row, 'checkout', actor_ref, at)
    row.state, row.closed_at, row.revision = 'closed', at, 4
    audit(db, row, 'closed', actor_ref, at)
    db.flush()
    return row
''')

change('app/services/restaurant_service_group_service.py',
       '''    rounds = []
    for row in rows:
        if not (row.entry_source == 'assisted' or
                row.entry_source == 'customer' and row.guest_visit_ref == group.visit_ref and group.visit_ref):
            o.fail()
''',
       '''    rounds = []
    counter = is_counter_bill(group)
    if counter and (len(rows) != 1 or rows[0].entry_source != 'counter'):
        o.fail()
    for row in rows:
        if not (counter or row.entry_source == 'assisted' or
                row.entry_source == 'customer' and row.guest_visit_ref == group.visit_ref and group.visit_ref):
            o.fail()
''')

change('app/services/restaurant_service_group_service.py',
       '''        rows = db.query(Group).filter_by(establishment_id=parent.id, owner_scope=o._scope(db, parent)).order_by(
''',
       '''        rows = db.query(Group).filter_by(establishment_id=parent.id, owner_scope=o._scope(db, parent)).filter(
            Group.order_until > Group.created_at).order_by(
''')

change('app/services/restaurant_money_service.py',
       '''    for row in rows:
        if not (row.entry_source == 'assisted' or
                row.entry_source == 'customer' and group.visit_ref and row.guest_visit_ref == group.visit_ref):
            o.fail()
    return rows
''',
       '''    counter = groups.is_counter_bill(group)
    if counter and (len(rows) != 1 or rows[0].entry_source != 'counter'):
        o.fail()
    for row in rows:
        if not (counter or row.entry_source == 'assisted' or
                row.entry_source == 'customer' and group.visit_ref and row.guest_visit_ref == group.visit_ref):
            o.fail()
    return rows
''')

change('app/services/restaurant_fulfillment_service.py',
       '''            result={'operation_outcome':previous,'current_order':o._order_dto(order)};db.commit();return result
''',
       '''            result={'operation_outcome':previous,'current_order':o._order_dto(order)}
            if counter:result['bill_group_ref']=previous['bill_group_ref']
            db.commit();return result
''')

change('app/services/restaurant_fulfillment_service.py',
       '''        if counter:
            from app.services.restaurant_inventory_service import consume_counter
            consume_counter(db, parent, order, at, actor.public_ref)
        if not counter:dest.order_ref=order.public_ref # One private copy; draft access ceases.
''',
       '''        bill_group_ref = None
        if counter:
            from app.services.restaurant_inventory_service import consume_counter
            from app.services.restaurant_service_group_service import counter_handoff_bill
            consume_counter(db, parent, order, at, actor.public_ref)
            bill_group_ref = counter_handoff_bill(db, parent, order, actor.public_ref, at).public_ref
        if not counter:dest.order_ref=order.public_ref # One private copy; draft access ceases.
''')

change('app/services/restaurant_fulfillment_service.py',
       '''        outcome=dict(order_ref=order.public_ref,revision=1,state=order.state)
''',
       '''        outcome=dict(order_ref=order.public_ref,revision=1,state=order.state)
        if bill_group_ref:outcome['bill_group_ref']=bill_group_ref
''')

change('app/services/restaurant_fulfillment_service.py',
       '''        db.commit();return {'operation_outcome':outcome,'current_order':o._order_dto(order)}
''',
       '''        result={'operation_outcome':outcome,'current_order':o._order_dto(order)}
        if bill_group_ref:result['bill_group_ref']=bill_group_ref
        db.commit();return result
''')

change('app/services/restaurant_order_service.py',
       '''def _detail(db, order):
    result = _order_dto(order)
''',
       '''def _detail(db, order):
    result = _order_dto(order)
    if order.entry_source == 'counter':
        from app.database.restaurant_service_models import RestaurantServiceLinkDB as Link
        linked = db.get(Link, order.public_ref)
        if linked:
            result['bill_group_ref'] = linked.group_ref
''')

change('app/services/restaurant_pos_service.py',
       '''import json
''',
       '''import json
from app.database.restaurant_service_models import RestaurantServiceLinkDB as Link
''')

change('app/services/restaurant_pos_service.py',
       '''        return {'intake_released': api.intake_allowed(parent), 'items': items,
                'recent': [_receipt(row) for row in rows]}
''',
       '''        links = {link.order_ref: link.group_ref for link in db.query(Link).filter(
            Link.order_ref.in_([row.public_ref for row in rows])).all()} if rows else {}
        return {'intake_released': api.intake_allowed(parent), 'items': items,
                'recent': [_receipt(row, links.get(row.public_ref)) for row in rows]}
''')

change('app/services/restaurant_pos_service.py',
       '''def _receipt(row):
    return {'order_ref': row.public_ref, 'revision': row.revision, 'state': row.state,
''',
       '''def _receipt(row, bill_group_ref=None):
    return {'order_ref': row.public_ref, 'bill_group_ref': bill_group_ref,
            'revision': row.revision, 'state': row.state,
''')
