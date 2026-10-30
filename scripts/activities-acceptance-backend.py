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
from app.services.dashboard_auth_service import _keyed_hash
from tests.wenze_fixture_support import create_wenze_store
from tests.test_restaurant_personal_lifecycle import create,publish,edit
accounts={}
for index,kind in enumerate(['empty','one','many']):
    phone='24382009990'+str(index)
    with SessionLocal() as db:
        account=UserAccountDB(phone_number=phone,personal_name='Acceptance '+kind,city='Kinshasa',country_code='CD')
        db.add(account);db.commit()
        accounts[kind]=dict(actor_account_id=account.id,actor_account_ref=account.public_ref,active_business_id=None)
        db.add(DashboardSessionDB(account_id=account.id,token_hash=_keyed_hash('dashboard-session','activities-acceptance-'+kind+'-session'),last_seen_at=datetime.now(timezone.utc),expires_at=datetime.now(timezone.utc)+timedelta(hours=4)))
        db.commit()
    if kind!='empty':
        store=create_wenze_store({'owner_phone':phone,'name':'Acceptance Boutique','category':'fashion_clothing','city':'Kinshasa'})
        assert store
    if kind=='many':
        who=accounts[kind]
        publish(who,create(who,key='active',name='Acceptance Kitchen'))
        create(who,key='draft',name='Draft Malewa')
        inactive=publish(who,create(who,key='inactive',name='Earlier Kitchen'))
        edit(who,inactive,status='inactive')
print('Controlled accounts and normal domain records created.',flush=True)
import uvicorn
uvicorn.run(app,host='127.0.0.1',port=8057,log_level='warning',access_log=False)
