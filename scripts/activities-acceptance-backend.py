"""Disposable local acceptance backend. No provider configuration is read."""
import os, sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from pydantic_settings import BaseSettings
original=BaseSettings.__init__
def isolated(self,*args,**kw):
    kw['_env_file']=None
    original(self,*args,**kw)
BaseSettings.__init__=isolated
root=Path(sys.argv[1]).resolve()
assert (root/'app/main.py').is_file(), 'Pass the SHIDA backend checkout as the first argument'
from tempfile import TemporaryDirectory
fixture_directory=TemporaryDirectory(prefix='shida-activities-')
sys.path.insert(0,str(root))
os.environ.update(APP_ENV='test',DATABASE_URL='sqlite:///'+str(Path(fixture_directory.name)/'activities.db'),WHATSAPP_VERIFY_TOKEN='local-test-only',DASHBOARD_AUTH_PEPPER='activities-local-test-only',ADMIN_KEY='local-test-only')
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import UserAccountDB,DashboardSessionDB
from app.database import models as m
from app.services.dashboard_auth_service import _keyed_hash
from tests.wenze_fixture_support import create_wenze_store
from tests.test_restaurant_personal_lifecycle import create,publish,edit
accounts={}
for index,kind in enumerate(['empty','one','many','overview','properties','private']):
    phone='24382009990'+str(index)
    with SessionLocal() as db:
        account=UserAccountDB(phone_number=phone,personal_name='Acceptance '+kind,city='Kinshasa',country_code='CD')
        db.add(account);db.commit()
        accounts[kind]=dict(actor_account_id=account.id,actor_account_ref=account.public_ref,active_business_id=None)
        db.add(DashboardSessionDB(account_id=account.id,workspace='personal',token_hash=_keyed_hash('dashboard-session','activities-acceptance-'+kind+'-session'),last_seen_at=datetime.now(timezone.utc),expires_at=datetime.now(timezone.utc)+timedelta(hours=4)))
        db.commit()
    if kind in ('one','many','overview'):
        store=create_wenze_store({'owner_phone':phone,'name':'Boutique Mwinda' if kind=='overview' else 'Acceptance Boutique','category':'fashion_clothing','city':'Kinshasa'})
        assert store
    if kind=='many':
        who=accounts[kind]
        publish(who,create(who,key='active',name='Acceptance Kitchen'))
        create(who,key='draft',name='Draft Malewa')
        inactive=publish(who,create(who,key='inactive',name='Earlier Kitchen'))
        edit(who,inactive,status='inactive')
    if kind=='overview':
        assert create_wenze_store({'owner_phone':phone,'name':'Maison Kivu','category':'fashion_clothing','city':'Kinshasa'})
        publish(accounts[kind],create(accounts[kind],name='Malewa Mama Rose'))
        with SessionLocal() as db:
            account=db.query(UserAccountDB).filter_by(phone_number=phone).one()
            owner=dict(owner_account_id=account.id,owner_account_ref=account.public_ref)
            profile=m.ServiceProviderProfileDB(public_ref='SVI_overview',name='Électricité à domicile',**owner)
            db.add(profile);db.flush()
            for index,name in enumerate(['Installation','Réparation']):
                db.add(m.ServiceProviderDB(provider_profile_id=profile.id,public_ref=f'SVC_overview{index}',provider_public_ref=profile.public_ref,phone_number=phone,name=profile.name,service_name=name,category='electricity',location='Kinshasa',publication_origin='pilot'))
            db.add(m.PosterDB(public_ref='JOB_overview',role='job_poster',phone_number=phone,name='Recruiter',job='Vendeur en boutique',location='Kinshasa',work_city='Kinshasa',**owner))
            db.commit()
    if kind=='private':
        hidden=create_wenze_store({'owner_phone':phone,'name':'Atelier privé','category':'fashion_clothing','city':'Kinshasa'})
        with SessionLocal() as db:
            db.query(m.WenzeStoreDB).filter_by(public_ref=hidden['public_ref']).one().visible='false'
            db.commit()
    if kind=='properties':
        with SessionLocal() as db:
            owner=dict(owner_account_id=accounts[kind]['actor_account_id'],owner_account_ref=accounts[kind]['actor_account_ref'])
            db.add(m.HotelListingDB(owner_phone=phone,name='Hôtel du fleuve',**owner))
            db.add(m.WewaDriverProfileDB(driver_phone=phone,display_name='Transport Kivu',**owner))
            db.add(m.SeekerDB(owner_account_id=accounts[kind]['actor_account_id'],
                owner_account_ref=accounts[kind]['actor_account_ref'],phone_number=phone,
                name='Test candidat',job='Électricien',location='Kinshasa',profile_type='professional'))
            for index,(name,area) in enumerate([('Appartement du fleuve','Gombe'),('Résidence du parc','Lemba')]):
                db.add(m.ApartmentListingDB(owner_account_id=accounts[kind]['actor_account_id'],owner_phone=phone,
                    public_ref=f'APT_overview{index}',listing_title=name,city='Kinshasa',commune=area,number_of_rooms=2,price=100,status='AVAILABLE'))
            db.commit()
print('Controlled accounts and normal domain records created.',flush=True)
import uvicorn
uvicorn.run(app,host='127.0.0.1',port=8057,log_level='warning',access_log=False)
