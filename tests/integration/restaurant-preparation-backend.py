"""10F2 synthetic loopback acceptance fixture. Production Backend is unmodified.
Extends the durable disposable 10F1 fixture, with station/grant control routes.
"""
import runpy
from pathlib import Path
from uuid import uuid4
h = runpy.run_path(str(Path(__file__).with_name('restaurant-service-backend.py')))
app, states = h['app'], h['states']
from app.database.connection import SessionLocal
from app.database.models import BusinessMemberDB, RestaurantMenuItemDB
from app.services import restaurant_preparation_service as prep
from app.services import restaurant_assisted_service as service
from app.services import restaurant_menu_service as menu
from app.services import restaurant_kitchen_assignment_service as assigned
from app.services import business_module_grant_service as grants
from fastapi import HTTPException

def scope(mode):
    state = states[mode]
    return dict(who=state['owner'], establishment_ref=state['data']['ref'])

def order(mode, standalone, plates=None):
    args = scope(mode)
    b = service.create(**args, operation_key=uuid4().hex)
    b = service.quote(**args, basket_ref=b['basket_ref'], expected_revision=b['revision'],
        selections={'standalone': standalone, 'plates': plates or []},
        food_preference='Original preference: no chili or ice', operation_key=uuid4().hex)['basket']
    return service.submit(**args, basket_ref=b['basket_ref'], quote_ref=b['quote_ref'],
        expected_revision=b['revision'], operation_key=uuid4().hex, confirm=True)['current_order']['order_ref']

@app.post('/__preparation/seed/{mode}')
def seed(mode: str):
    if mode not in {'personal','organization'}: raise HTTPException(404)
    data = h['seed'](mode)
    state = states[mode]
    args = scope(mode)
    # Historical order is accepted while every selected item remains unconfigured.
    data['legacy'] = order(mode, [{'key':'legacy_food','item_ref':data['food'],'quantity':1}])
    who = state['owner']
    with SessionLocal() as db:
        item = db.query(RestaurantMenuItemDB).filter_by(public_ref=data['food']).one()
        cat = db.get(menu.Category, item.category_id).public_ref
    actor_phone = state.get('phone')
    mscope = dict(actor_phone=actor_phone,business_id=who['active_business_id'],active_business_id=who['active_business_id'],establishment_ref=data['ref']) if mode=='organization' else {**who,'establishment_ref':data['ref']}
    state['preparation_menu_scope'] = mscope
    drink = menu.command(**mscope,kind='item',fields=dict(name='Original mango drink',category_ref=cat,
        presentation='fixed_dish',pricing_model='UNIT_PRICED',currency='CDF',unit_price='500',sale_unit_label='glass'),
        operation_key=uuid4().hex,expected_updated_at=menu.managed_menu(**mscope)['revision'])['result']['public_ref']
    prep.configure(**args,item_ref=drink,station='bar',supported_non_alcoholic_drink=True,
        operation_key=uuid4().hex,expected_updated_at=menu.managed_menu(**mscope)['revision'])
    data['drink'] = drink
    data['mixed'] = order(mode,[{'key':'drink','item_ref':drink,'quantity':1}, {'key':'food','item_ref':data['food'],'quantity':1}],
        [{'key':'original_plate','components':[{'key':'pondu','item_ref':data['pondu'],'selected_amount':'1000.00'}]}])
    data['bar_only'] = order(mode,[{'key':'bar_only','item_ref':drink,'quantity':1}])
    data['recovery'] = order(mode,[{'key':'recovery_drink','item_ref':drink,'quantity':1}, {'key':'recovery_food','item_ref':data['food'],'quantity':1}])
    if mode=='organization':
        state['prep_grants']={};state['prep_assignments']={}
        for station in ['kitchen','bar']:
            with SessionLocal() as db:
                g=grants.set_member_module_grant(db,organization_ref=data['business'],actor_phone_number=state['phone'],
                    member_ref=state['member'],module='restaurants',capability=station+'_work',active=True,expected_revision=0)
            a=assigned.set_assignment(who=who,establishment_ref=data['ref'],member_ref=state['member'],
                active=True,expected_revision=0,expected_grant_revision=g['revision'],function=station)
            state['prep_grants'][station]=g;state['prep_assignments'][station]=a
        data['preparation_assignments']=state['prep_assignments']
    return data

@app.post('/__preparation/{mode}/menu-change/{item_ref}')
def menu_change(mode: str, item_ref: str):
    return prep.configure(**scope(mode),item_ref=item_ref,station='kitchen',operation_key=uuid4().hex,
        expected_updated_at=menu.managed_menu(**states[mode]['preparation_menu_scope'])['revision'])

@app.post('/__preparation/worker/{station}/{active}')
def permission(station: str, active: str):
    if station not in {'kitchen','bar'}: raise HTTPException(404)
    state=states['organization'];g=state['prep_grants'][station]
    with SessionLocal() as db:
        g=grants.set_member_module_grant(db,organization_ref=state['data']['business'],actor_phone_number=state['phone'],
            member_ref=state['member'],module='restaurants',capability=station+'_work',active=active=='on',expected_revision=g['revision'])
    state['prep_grants'][station]=g
    if active=='on':
        state['prep_assignments'][station]=assigned.set_assignment(who=state['owner'],establishment_ref=state['data']['ref'],
            member_ref=state['member'],active=True,expected_revision=0,expected_grant_revision=g['revision'],function=station)
    return {'assignment':state['prep_assignments'][station]}

@app.post('/__preparation/{mode}/{order_ref}/{station}/{action}')
def action(mode: str, order_ref: str, station: str, action: str):
    args=scope(mode)
    current=prep.detail(**args,order_ref=order_ref,station=station,recovery=True)
    return prep.act(**args,order_ref=order_ref,station=station,action=action,expected_revision=current['revision'],operation_key=uuid4().hex)['current_order']

@app.get('/__preparation/{mode}/{order_ref}/{station}')
def detail(mode: str, order_ref: str, station: str):
    return prep.detail(**scope(mode),order_ref=order_ref,station=station,recovery=True)

if __name__=='__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=3443,ssl_keyfile=str(h['h']['ROOT']/'.s3a-local/09b2-tls/key.pem'),ssl_certfile=str(h['h']['ROOT']/'.s3a-local/09b2-tls/cert.pem'),access_log=False)
