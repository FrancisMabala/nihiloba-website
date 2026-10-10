"""10F1 isolated real Backend browser fixture. No production settings or transports.
Uses a fresh durable SQLite database from the existing 09B2 fixture; no Backend
source changes. Control routes are local fixture helpers, never production APIs.
"""
import runpy
from pathlib import Path
from datetime import datetime, timedelta, timezone
from uuid import uuid4
h=runpy.run_path(str(Path(__file__).with_name('restaurant-guest-backend.py')))
app,settings,owners=h['app'],h['settings'],h['owners']
settings.dashboard_allowed_origins='https://localhost:3014,https://localhost:3015'
from app.database.connection import SessionLocal
from app.database.models import UserAccountDB, BusinessDB, BusinessMemberDB, DashboardSessionDB, SubscriptionDB
from app.services.dashboard_auth_service import _keyed_hash
from app.services import restaurant_assisted_service as service,restaurant_service_group_service as groups,restaurant_kitchen_assignment_service as assignments,business_module_grant_service as grants
from app.services import restaurant_menu_service as menu,restaurant_order_service as orders
from app.services.vertical_marketplace_service import create_food_business,update_vertical_profile
from app.services.marketplace_access_service import replace_business_marketplaces
from tests.test_vertical_marketplaces import _organization
from fastapi import HTTPException
states={}
allowed_refs=set()
def subscribe(who):
 now=datetime.now(timezone.utc)
 with SessionLocal() as db:
  db.add(SubscriptionDB(personal_account_id=who['actor_account_id'] if who['active_business_id'] is None else None,
   organization_id=who['active_business_id'],commercial_family='restaurant' if who['active_business_id'] is None else 'business',
   plan_key='restaurant_pro' if who['active_business_id'] is None else 'business_paid',plan_version=1,status='active',
   starts_at=now,current_period_start=now,current_period_end=now+timedelta(days=30),commercial_source='controlled_fixture'))
  db.commit()
@app.post('/__service/seed/{mode}')
def seed(mode:str):
 if mode not in {'personal','organization'}:raise HTTPException(404)
 if mode=='personal':
  data=h['seed']();who=owners[data['ref']]
 else:
  phone='243'+str(int(uuid4().hex[:10],16)).zfill(12)
  org=_organization(phone)
  replace_business_marketplaces(business_id=org['id'],actor_phone=phone,enabled_marketplaces={'restaurants'})
  with SessionLocal() as db:
   actor=db.query(UserAccountDB).filter_by(phone_number=phone).one()
   who=dict(actor_account_id=actor.id,actor_account_ref=actor.public_ref,active_business_id=org['id'])
   business=db.get(BusinessDB,org['id']);business.name='Service Org '+uuid4().hex[:6]
   orgref=business.public_ref;db.commit()
  row=create_food_business(actor_phone=phone,business_id=org['id'],active_business_id=org['id'],operation_key=uuid4().hex,name='Service Business '+uuid4().hex[:6],food_business_type='malewa')
  row=update_vertical_profile(actor_phone=phone,marketplace='restaurants',profile_id=row['id'],active_business_id=org['id'],
   expected_updated_at=row['updated_at'],fields=dict(description='Isolated Service meals',city='Kinshasa',commune='Gombe',quartier='Centre',
   public_address='Test counter',address_visibility='public',confirm_location=True,timezone_name='Africa/Kinshasa',status='active'))
  ref=row['public_ref'];owners[ref]=who
  scope=dict(actor_phone=phone,business_id=org['id'],active_business_id=org['id'],establishment_ref=ref)
  def write(kind,fields):
   return menu.command(**scope,kind=kind,fields=fields,operation_key=uuid4().hex,expected_updated_at=menu.managed_menu(**scope)['revision'])['result']['public_ref']
  cat=write('category',{'name':'Service foods'})
  food=write('item',dict(name='Fufu',category_ref=cat,presentation='fixed_dish',pricing_model='UNIT_PRICED',currency='CDF',unit_price='1000.25',sale_unit_label='bowl'))
  pondu=write('item',dict(name='Pondu',category_ref=cat,presentation='component',pricing_model='AMOUNT_PRICED',currency='CDF',allowed_amounts=['500','1000']))
  data={'ref':ref,'food':food,'pondu':pondu,'business':orgref}
 subscribe(who)
 with SessionLocal() as db:
  actor=db.get(UserAccountDB,who['actor_account_id']);actor.is_registered=True;actor.personal_name='Service Owner'
  actor.account_type='personal';db.commit()
 state={'owner':who,'data':data}
 if mode=='organization':
  with SessionLocal() as db:
   worker=UserAccountDB(phone_number='243'+str(int(uuid4().hex[:10],16)).zfill(12),personal_name='Service Worker',account_type='personal');db.add(worker);db.flush()
   member=BusinessMemberDB(business_id=org['id'],phone_number=worker.phone_number,personal_account_id=worker.id,personal_account_ref=worker.public_ref,role='staff',status='active');db.add(member);db.flush()
   state.update(worker=dict(actor_account_id=worker.id,actor_account_ref=worker.public_ref,active_business_id=org['id']),member=member.public_ref,phone=phone)
   db.commit()
  with SessionLocal() as db:
   grant=grants.set_member_module_grant(db,organization_ref=data['business'],actor_phone_number=phone,member_ref=state['member'],module='restaurants',capability='service_work',active=True,expected_revision=0)
  state['grant']=grant
  state['assignment']=assignments.set_assignment(who=who,establishment_ref=data['ref'],member_ref=state['member'],active=True,expected_revision=0,expected_grant_revision=grant['revision'],function='service')
  data.update(member=state['member'],assignment=state['assignment'])
 states[mode]=state;allowed_refs.add(data['ref']);settings.restaurant_order_intake_allowlist=','.join(sorted(allowed_refs))
 data['name']=row['name'] if mode=='organization' else 'Guest Test Malewa'
 return data
@app.post('/__service/session/{label}')
def session(label:str):
 state=states['organization' if label in {'owner','worker'} else 'personal'];who=state['worker' if label=='worker' else 'owner'];token=uuid4().hex
 with SessionLocal() as db:
  db.add(DashboardSessionDB(account_id=who['actor_account_id'],token_hash=_keyed_hash('dashboard-session',token),
   last_seen_at=datetime.now(timezone.utc),expires_at=datetime.now(timezone.utc)+timedelta(hours=1)));db.commit()
 return {'token':token}
@app.post('/__service/{mode}/paid/{active}')
def paid(mode:str,active:str):
 who=states[mode]['owner']
 with SessionLocal() as db:
  q=db.query(SubscriptionDB)
  q=q.filter_by(organization_id=who['active_business_id']) if who['active_business_id'] else q.filter_by(personal_account_id=who['actor_account_id'])
  q.update({'status':'active' if active=='on' else 'cancelled'});db.commit()
 return {'ok':True}
@app.post('/__service/worker/{active}')
def worker_grant(active:str):
 state=states['organization'];g=state['grant'];a=state['assignment']
 with SessionLocal() as db:
  state['grant']=grants.set_member_module_grant(db,organization_ref=state['data']['business'],actor_phone_number=state['phone'],
   member_ref=state['member'],module='restaurants',capability='service_work',active=active=='on',expected_revision=g['revision'])
 if active=='on':
  state['assignment']=assignments.set_assignment(who=state['owner'],establishment_ref=state['data']['ref'],member_ref=state['member'],
   active=True,expected_revision=0,expected_grant_revision=state['grant']['revision'],function='service')
 return {'assignment':state['assignment']}
@app.post('/__service/{mode}/prepare/{order_ref}')
def prepare(mode:str,order_ref:str):
 scope=dict(who=states[mode]['owner'],establishment_ref=states[mode]['data']['ref'])
 current=service.detail(**scope,order_ref=order_ref)
 for action in ['start','ready']:
  if current['state']==('accepted' if action=='start' else 'preparing'):
   current=service.act(**scope,order_ref=order_ref,action=action,expected_revision=current['revision'],operation_key=uuid4().hex)['current_order']
 return current
@app.post('/__service/{mode}/role/{role}')
def role(mode:str,role:str):
 state=states[mode]
 with SessionLocal() as db:
  m=db.query(BusinessMemberDB).filter_by(business_id=state['owner']['active_business_id'],personal_account_id=state['owner']['actor_account_id']).one();m.role=role;db.commit()
 return {'ok':True}
@app.post('/__service/expire/{proposal_ref}')
def expire(proposal_ref:str):
 from app.database.restaurant_service_models import RestaurantServiceProposalDB
 with SessionLocal() as db:
  row=db.query(RestaurantServiceProposalDB).filter_by(public_ref=proposal_ref).one()
  row.created_at=h['clock'][0]-timedelta(minutes=11);row.expires_at=h['clock'][0]-timedelta(seconds=1);db.commit()
 return {'ok':True}
if __name__=='__main__':
 import uvicorn
 uvicorn.run(app,host='127.0.0.1',port=3443,ssl_keyfile=str(h['ROOT']/'.s3a-local/09b2-tls/key.pem'),ssl_certfile=str(h['ROOT']/'.s3a-local/09b2-tls/cert.pem'),access_log=False)
