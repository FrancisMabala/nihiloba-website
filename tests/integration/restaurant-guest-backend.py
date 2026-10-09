"""09B2 real Backend loopback TLS fixture. No Backend source or .env changes.

Synthetic owner and no guest accounts. A fresh website-owned SQLite database,
ordinary durability, transport/network isolation, no access logging. Test control
routes exist only in this process; never import this fixture in production.
"""
import os
import sys
import socket
from pathlib import Path
from datetime import datetime, timedelta, timezone
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT.parent / 'Backend'
scratch = ROOT / '.s3a-local' / ('guest-' + uuid4().hex)
scratch.mkdir(parents=True)
os.environ.update(DATABASE_URL='sqlite:///' + (scratch / 'fresh_test.db').as_posix(),
    APP_ENV='test', ADMIN_KEY='isolated-09b2', WHATSAPP_VERIFY_TOKEN='isolated-no-delivery',
    DASHBOARD_AUTH_PEPPER='isolated-09b2-guest-pepper', RATE_LIMIT_PEPPER='isolated-09b2-rate-pepper')
sys.path.insert(0, str(BACKEND))
from pydantic_settings import BaseSettings
original_init = BaseSettings.__init__
def isolated_settings(self, *args, **kwargs):
    kwargs['_env_file'] = None
    original_init(self, *args, **kwargs)
BaseSettings.__init__ = isolated_settings
original_connect = socket.socket.connect
def isolated_connect(self, address):
    if isinstance(address, tuple) and address[0] not in ('127.0.0.1', '::1', 'localhost'):
        raise RuntimeError('External network disabled in guest test fixture')
    return original_connect(self, address)
socket.socket.connect = isolated_connect

from app.main import app
from app.config import settings
from app.database.connection import SessionLocal, Base, engine
from app.database.models import UserAccountDB, FoodBusinessDB, RateLimitBucketDB
from app.services import restaurant_order_service as orders, restaurant_menu_service as menu
from app.services.restaurant_lifecycle_service import update_personal_profile
from app.services.vertical_marketplace_service import create_food_business
from app.services import restaurant_social_service as social
from fastapi import HTTPException

Base.metadata.create_all(engine)
settings.dashboard_allowed_origins = 'https://localhost:3014'
settings.nihiloba_public_base_url = 'https://localhost:3014/shida'
settings.public_base_url = 'https://localhost:3443'
settings.shida_whatsapp_number = ''
settings.restaurant_order_intake_enabled = True
settings.restaurant_web_checkout_enabled = True
settings.restaurant_order_intake_allowlist = ''
clock = [datetime.now(timezone.utc).replace(microsecond=0)]
orders.now = lambda db: clock[0]
orders.timing.now = lambda: clock[0]
owners = {}

@app.post('/__guest/seed')
def seed():
    # Clear only this disposable fixture's request counters between scenarios.
    with SessionLocal() as db:
        db.query(RateLimitBucketDB).delete()
        actor = UserAccountDB(phone_number='243' + str(int(uuid4().hex[:10],16)).zfill(12))
        db.add(actor); db.commit()
        owner = dict(actor_account_id=actor.id, actor_account_ref=actor.public_ref, active_business_id=None)
    settings.restaurant_order_intake_enabled = True
    row = create_food_business(**owner,operation_key=uuid4().hex,name='Guest Test Malewa ' + uuid4().hex[:6],food_business_type='malewa')
    row = update_personal_profile(**owner,profile_ref=row['public_ref'],expected_updated_at=row['updated_at'],fields=dict(
        description='Isolated account-free meals',city='Kinshasa',commune='Gombe',quartier='Centre',
        public_address='Test collection counter',address_visibility='public',confirm_location=True,
        timezone_name='Africa/Kinshasa',status='active'))
    ref = row['public_ref']; args = {**owner,'establishment_ref':ref}; owners[ref] = owner
    settings.restaurant_order_intake_allowlist = ref
    def write(kind, fields, target=None):
        return menu.command(**args,kind=kind,fields=fields,target_ref=target,operation_key=uuid4().hex,
            expected_updated_at=menu.managed_menu(**args)['revision'])['result']['public_ref']
    cat = write('category',{'name':'Local meals'})
    food = write('item',dict(name='Fufu',category_ref=cat,presentation='fixed_dish',pricing_model='UNIT_PRICED',currency='CDF',unit_price='1000.25',sale_unit_label='bowl'))
    pondu = write('item',dict(name='Pondu',category_ref=cat,presentation='component',pricing_model='AMOUNT_PRICED',currency='CDF',allowed_amounts=['500','1000']))
    at = clock[0]
    intake = orders.configure_pickup(who=owner,establishment_ref=ref,enabled=True,
        windows=[dict(starts_at=(at+timedelta(minutes=1)).astimezone(timezone(timedelta(hours=1))).strftime('%Y-%m-%d %H:%M'),
            ends_at=(at+timedelta(hours=2)).astimezone(timezone(timedelta(hours=1))).strftime('%Y-%m-%d %H:%M'))],
        expected_updated_at=menu.managed_menu(**args)['revision'],operation_key=uuid4().hex)
    # An already active window: signed-in scheduled options no longer apply.
    clock[0] = at + timedelta(minutes=2)
    link = social.link(ref,social.MENU)
    return {'ref':ref,'food':food,'pondu':pondu,'window':intake['windows'][0]['public_ref'],
        'qr':'https://localhost:3443/go/' + link['public_token']}

@app.post('/__guest/{ref}/orders/{order_ref}/{action}')
def seller_action(ref:str, order_ref:str, action:str):
    if ref not in owners or action not in {'accept','start','ready','reject','approve_cancellation'}: raise HTTPException(404)
    who = owners[ref]
    current = orders.read_order(who=who,establishment_ref=ref,order_ref=order_ref,side='operator')
    extra = {'reason':'cannot_fulfill'} if action=='reject' else {'reason':'customer_cancelled'} if action=='approve_cancellation' else {}
    return orders.act(who=who,establishment_ref=ref,order_ref=order_ref,side='operator',action=action,
        expected_revision=current['revision'],operation_key=uuid4().hex,**extra)['current_order']

@app.post('/__guest/{ref}/handoff/{order_ref}')
def handoff(ref:str,order_ref:str,body:dict):
    who=owners[ref]; current=orders.read_order(who=who,establishment_ref=ref,order_ref=order_ref,side='operator')
    result=orders.act(who=who,establishment_ref=ref,order_ref=order_ref,side='operator',action='verify_pickup',
        expected_revision=current['revision'],operation_key=uuid4().hex,pickup_code=body['pickup_code'])
    return {'state':result['current_order']['state']}

@app.post('/__guest/{ref}/intake/{mode}')
def intake(ref:str,mode:str):
    if mode=='closed': settings.restaurant_order_intake_enabled=False
    elif mode=='empty':
        orders.configure_pickup(who=owners[ref],establishment_ref=ref,enabled=False,windows=[],
            expected_updated_at=menu.managed_menu(**owners[ref],establishment_ref=ref)['revision'],operation_key=uuid4().hex)
    else: raise HTTPException(404)
    return {'ok':True}

@app.post('/__guest/{ref}/price/{food}')
def price(ref:str,food:str):
    args={**owners[ref],'establishment_ref':ref}
    menu.command(**args,kind='item',target_ref=food,fields={'unit_price':'1200.00'},
        expected_updated_at=menu.managed_menu(**args)['revision'],operation_key=uuid4().hex)
    return {'ok':True}

@app.post('/__guest/advance/{minutes}')
def advance(minutes:int):
    clock[0] += timedelta(minutes=minutes)
    return {'ok':True}

@app.post('/__guest/{ref}/currency')
def currency(ref:str):
    args={**owners[ref],'establishment_ref':ref}
    with SessionLocal() as db:
        parent=db.query(FoodBusinessDB).filter_by(public_ref=ref).one();parent.menu_currency='USD';db.commit()
    for item in menu.managed_menu(**args)['result']['items']:
        menu.command(**args,kind='item',target_ref=item['public_ref'],fields={'currency':'USD',**({'unit_price':'2.50'} if item['pricing_model']=='UNIT_PRICED' else {'allowed_amounts':['1','2']})},
            expected_updated_at=menu.managed_menu(**args)['revision'],operation_key=uuid4().hex)
    return {'ok':True}

if __name__ == '__main__':
    import uvicorn
    print('Isolated guest Backend DB: ' + str(scratch),flush=True)
    uvicorn.run(app,host='127.0.0.1',port=3443,ssl_keyfile=str(ROOT/'.s3a-local/09b2-tls/key.pem'),
        ssl_certfile=str(ROOT/'.s3a-local/09b2-tls/cert.pem'),access_log=False)
