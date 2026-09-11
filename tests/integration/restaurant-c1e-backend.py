"""C1-E wrapper for the existing loopback-only synthetic Backend harness.
Never imports production .env, changes Backend files, or invokes transports.
"""
import runpy
import os
import psycopg2
# A fresh schema preserves the older S3-A fixtures. Only this disposable database.
with psycopg2.connect('postgresql://s3a:isolated_test_only@127.0.0.1:55439/restaurant_r0a_test') as db:
    with db.cursor() as cursor: cursor.execute('CREATE SCHEMA IF NOT EXISTS c1e_web')
os.environ['PGOPTIONS']='-c search_path=c1e_web'
os.environ['RESTAURANT_C1E_FIXTURE_SCHEMA']='c1e_web'

from pathlib import Path
h = runpy.run_path(str(Path(__file__).with_name('restaurant-backend.py')))
app, settings, actors = h['app'], h['settings'], h['actors']
settings.dashboard_allowed_origins = 'https://localhost:3014'
from app.database.connection import SessionLocal
from app.database.models import UserAccountDB, FoodBusinessDB
from app.services import restaurant_order_service as orders, restaurant_menu_service as menu
from app.services.restaurant_lifecycle_service import update_personal_profile
from app.services.vertical_marketplace_service import create_food_business
from datetime import datetime, timedelta, timezone
from uuid import uuid4


@app.post('/__c1e/seed')
def seed():
    # Enabled only inside this isolated process and only after explicit fixture setup.
    settings.restaurant_order_intake_enabled = True
    with SessionLocal() as db:
        for who in actors.values():
            db.get(UserAccountDB, who['actor_account_id']).is_registered = True
        db.commit()
    owner = actors['personal']
    row = create_food_business(**owner, operation_key=uuid4().hex,
        name='C1E kitchen ' + ''.join(chr(97+int(c,16)) for c in uuid4().hex[:8]), food_business_type='malewa')
    row = update_personal_profile(**owner, profile_ref=row['public_ref'], expected_updated_at=row['updated_at'],
        fields=dict(description='Synthetic local meals',city='Kinshasa',commune='Gombe',quartier='Centre',
            public_address='Synthetic collection point',address_visibility='public',confirm_location=True,
            timezone_name='Africa/Kinshasa',status='active'))
    ref=row['public_ref']; args={**owner,'establishment_ref':ref}
    def write(kind, fields):
        return menu.command(**args,kind=kind,fields=fields,operation_key=uuid4().hex,
            expected_updated_at=menu.managed_menu(**args)['revision'])['result']['public_ref']
    category=write('category',{'name':'Synthetic foods'})
    food=write('item',dict(name='Fufu',category_ref=category,presentation='component',pricing_model='UNIT_PRICED',currency='CDF',unit_price='1000.25',sale_unit_label='bowl'))
    at=datetime.now(timezone(timedelta(hours=1))).replace(microsecond=0)
    windows=[dict(starts_at=(at+timedelta(minutes=5)).isoformat(),ends_at=(at+timedelta(hours=2)).isoformat())]
    intake=orders.configure_pickup(who=owner,establishment_ref=ref,enabled=True,windows=windows,
        expected_updated_at=menu.managed_menu(**args)['revision'],operation_key=uuid4().hex)
    basket=orders.create_basket(who=actors['other'],establishment_ref=ref,entry_source='customer',operation_key=uuid4().hex)
    quote=orders.quote_basket(who=actors['other'],establishment_ref=ref,basket_ref=basket['basket_ref'],
        expected_revision=basket['revision'],operation_key=uuid4().hex,pickup_window_ref=intake['windows'][0]['public_ref'],
        selections={'standalone':[{'key':'food','item_ref':food,'quantity':2}],'plates':[]})['basket']
    order=orders.submit_pickup(who=actors['other'],establishment_ref=ref,basket_ref=basket['basket_ref'],
        expected_revision=quote['revision'],operation_key=uuid4().hex,quote_ref=quote['quote_ref'],confirm=True)['current_order']
    return {'ref':ref,'name':row['name'],'order':order,'food':food}

@app.post('/__c1e/close')
def close():
    settings.restaurant_order_intake_enabled=False
    return {'intake_released':False}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=3443,ssl_keyfile=str(h['ROOT']/'.s3a-local/key.pem'),ssl_certfile=str(h['ROOT']/'.s3a-local/cert.pem'),access_log=False)
