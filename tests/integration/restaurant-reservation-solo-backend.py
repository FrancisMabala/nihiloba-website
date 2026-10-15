"""Disposable real-Backend reservation browser fixture. Never imported in production."""
import json
import os
import socket
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[3] / 'Backend'
WEBSITE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
fixture_name = os.environ.get('RESTAURANT_BROWSER_DB_NAME', 'browser.db')
if not fixture_name.endswith('.db') or '/' in fixture_name or '\\' in fixture_name:
    raise RuntimeError('Expected a disposable browser fixture database filename')
os.environ['DATABASE_URL'] = 'sqlite:///' + (WEBSITE / '.restaurant-reservation-tests' / fixture_name).as_posix()
os.environ['APP_ENV'] = 'test'
os.environ['ADMIN_KEY'] = 'isolated-reservation-browser'
os.environ['DASHBOARD_AUTH_PEPPER'] = 'isolated-reservation-browser'
os.environ['WHATSAPP_VERIFY_TOKEN'] = 'isolated-no-delivery'

from pydantic_settings import BaseSettings
original_init = BaseSettings.__init__
def no_dotenv(self, *args, **kwargs):
    kwargs['_env_file'] = None
    original_init(self, *args, **kwargs)
BaseSettings.__init__ = no_dotenv

original_connect = socket.socket.connect
def local_only(self, address):
    if isinstance(address, tuple) and address[0] not in ('127.0.0.1', '::1'):
        raise RuntimeError('External connection forbidden in reservation browser fixture')
    return original_connect(self, address)
socket.socket.connect = local_only

from fastapi import HTTPException
from app.main import app
from app.config import settings
from app.database.connection import Base, SessionLocal, engine
from app.database.models import UserAccountDB, DashboardSessionDB, FoodBusinessDB, BusinessDB
from app.services.dashboard_auth_service import _keyed_hash
from app.services.vertical_marketplace_service import create_food_business, update_vertical_profile
from app.services.restaurant_lifecycle_service import update_personal_profile
from app.services.marketplace_access_service import replace_business_marketplaces
from app.services.storage.businesses import create_business
from app.services import restaurant_reservation_service as reservations
from app.services import restaurant_order_service as orders
from app.services import restaurant_menu_service as menus

settings.dashboard_allowed_origins = 'https://localhost:3014,https://localhost:3015'
Base.metadata.create_all(engine)
actors = {}
for label, phone in (('owner', '243000000001'), ('buyer', '243000000002'), ('other', '243000000003')):
    with SessionLocal() as db:
        row = UserAccountDB(phone_number=phone)
        db.add(row); db.commit()
        actors[label] = {'actor_account_id': row.id, 'actor_account_ref': row.public_ref,
            'active_business_id': None}

@app.post('/__reservation/session/{label}')
def session(label: str):
    if label not in actors:
        raise HTTPException(404)
    token = uuid4().hex
    with SessionLocal() as db:
        db.add(DashboardSessionDB(account_id=actors[label]['actor_account_id'],
            token_hash=_keyed_hash('dashboard-session', token),
            last_seen_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
        db.commit()
    return {'token': token}

@app.post('/__reservation/seed')
def seed():
    owner = actors['owner']
    personal_name = 'Reservation Personal ' + uuid4().hex[:6]
    organization_name = 'Reservation Business ' + uuid4().hex[:6]
    personal = create_food_business(**owner, operation_key=uuid4().hex,
        food_business_type='restaurant', name=personal_name)
    personal = update_personal_profile(**owner, profile_ref=personal['public_ref'],
        expected_updated_at=personal['updated_at'], fields={
            'description':'Seated meals', 'city':'Kinshasa', 'commune':'Gombe',
            'quartier':'Centre', 'address_visibility':'broad',
            'confirm_location':True, 'timezone_name':'Africa/Kinshasa',
            'status':'active'})
    business = create_business(name='Reservation Organization',
        owner_phone_number='243000000001', city='Kinshasa')
    replace_business_marketplaces(business_id=business['id'],
        actor_phone='243000000001', enabled_marketplaces={'restaurants'})
    organization = create_food_business(actor_phone='243000000001',
        business_id=business['id'], active_business_id=business['id'],
        operation_key=uuid4().hex, food_business_type='restaurant',
        name=organization_name)
    organization = update_vertical_profile(actor_phone='243000000001',
        marketplace='restaurants', profile_id=organization['id'],
        active_business_id=business['id'], expected_updated_at=organization['updated_at'],
        fields={'description':'Seated meals', 'city':'Kinshasa', 'commune':'Gombe',
            'quartier':'Centre', 'address_visibility':'broad',
            'confirm_location':True, 'timezone_name':'Africa/Kinshasa',
            'status':'active'})
    with SessionLocal() as db:
        for ref in (personal['public_ref'], organization['public_ref']):
            row = db.query(FoodBusinessDB).filter_by(public_ref=ref).one()
            row.service_modes = 'eat_there'
            row.opening_schedule = json.dumps({'timezone_name':'Africa/Kinshasa',
                'windows':[{'weekday': day,'start':'00:00','end':'23:59'} for day in range(7)]})
            row.hours_confirmed_at = datetime.now(timezone.utc)
            if ref == personal['public_ref']:
                row.address_visibility = 'public'
                row.public_address = 'Synthetic pickup point'
                row.location_confirmed_at = datetime.now(timezone.utc)
        db.commit()
        business_ref = db.get(BusinessDB, business['id']).public_ref
    reservations.configure(who=owner, establishment_ref=personal['public_ref'],
        enabled=True, expected_revision=0, operation_key=uuid4().hex)
    seller = {**owner, 'active_business_id': business['id']}
    reservations.configure(who=seller, establishment_ref=organization['public_ref'],
        enabled=True, expected_revision=0, operation_key=uuid4().hex)
    # Give the HTTPS guest-ingress probe one exact synthetic pickup venue.
    settings.restaurant_order_intake_enabled = True
    settings.restaurant_web_checkout_enabled = True

    menu_args = {**owner, 'establishment_ref':personal['public_ref']}
    category = menus.command(**menu_args, kind='category', fields={'name':'Synthetic food'},
        operation_key=uuid4().hex,
        expected_updated_at=menus.managed_menu(**menu_args)['revision'])['result']['public_ref']
    menus.command(**menu_args, kind='item', fields={'name':'Synthetic meal',
        'category_ref':category, 'presentation':'fixed_dish', 'pricing_model':'UNIT_PRICED',
        'currency':'CDF', 'unit_price':'1000.00', 'sale_unit_label':'portion'},
        operation_key=uuid4().hex,
        expected_updated_at=menus.managed_menu(**menu_args)['revision'])
    with SessionLocal() as db:
        revision = db.query(FoodBusinessDB).filter_by(public_ref=personal['public_ref']).one().updated_at
    pickup_at = datetime.now(ZoneInfo('Africa/Kinshasa')) + timedelta(minutes=10)
    orders.configure_pickup(who=owner, establishment_ref=personal['public_ref'],
        enabled=True, windows=[{'starts_at':pickup_at.strftime('%Y-%m-%d %H:%M'),
            'ends_at':(pickup_at + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M')}],
        expected_updated_at=revision, operation_key=uuid4().hex)
    local = datetime.now(ZoneInfo('Africa/Kinshasa')) + timedelta(days=1)
    local = local.replace(hour=13, minute=0, second=0, microsecond=0)
    return {'personal':personal['public_ref'], 'organization':organization['public_ref'],
        'personal_name':personal_name, 'organization_name':organization_name,
        'business':business_ref, 'date':local.strftime('%Y-%m-%dT%H:%M')}

if __name__ == '__main__':
    import uvicorn
    cert = WEBSITE / '.s3a-local' / '09b2-tls'
    uvicorn.run(app, host='127.0.0.1', port=3443,
        ssl_keyfile=str(cert / 'key.pem'), ssl_certfile=str(cert / 'cert.pem'),
        access_log=False)
