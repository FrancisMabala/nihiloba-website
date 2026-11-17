"""Real disposable Meda HTTP backend; only the external image provider is substituted."""
import os,sys
from pathlib import Path
from tempfile import TemporaryDirectory
from datetime import timedelta
from pydantic_settings import BaseSettings
original=BaseSettings.__init__
def isolated(self,*args,**kwargs):
    kwargs['_env_file']=None
    original(self,*args,**kwargs)
BaseSettings.__init__=isolated
root=Path(sys.argv[1]).resolve()
assert (root/'app/services/meda_service.py').is_file()
sys.path.insert(0,str(root))
temporary=TemporaryDirectory(prefix='shida-meda-acceptance-')
os.environ.update(APP_ENV='test',WEB_REGISTRATION_ENABLED='true',DATABASE_URL='sqlite:///'+str(Path(temporary.name)/'meda.db'),DASHBOARD_ALLOWED_ORIGINS='https://nihiloba.com',WHATSAPP_VERIFY_TOKEN='local-test-only',DASHBOARD_AUTH_PEPPER='meda-local-test-only',ADMIN_KEY='local-test-only')
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import UserAccountDB,DashboardSessionDB
from app.services.dashboard_auth_service import _keyed_hash
from app.services import meda_service as flow,meda_media
from app.services.asset_storage_provider import CloudinaryAssetStorageProvider
from tests.test_meda import data
images={}
def store_image(content,key):images[key]=content
meda_media.upload_restaurant_photo_bytes=store_image
CloudinaryAssetStorageProvider.get_delivery=lambda self,**kwargs:images[kwargs['storage_key']]
with SessionLocal() as db:
    for number,kind in enumerate(('owner','sender','stranger')):
        account=UserAccountDB(phone_number='24381009990'+str(number),personal_name='Meda '+kind,country_code='CD',city='Kinshasa')
        db.add(account);db.flush()
        db.add(DashboardSessionDB(account_id=account.id,workspace='personal',token_hash=_keyed_hash('dashboard-session','meda-acceptance-'+kind+'-session'),last_seen_at=flow.now(),expires_at=flow.now()+timedelta(hours=4)))
        if kind=='owner':
            listing=flow.create(db,account.id,account.public_ref,data(),'acceptance-listing')
            flow.change(db,account.id,account.public_ref,listing['reference'],'publish',1)
    db.commit()
print('Meda synthetic users ready; image-provider bytes retained in memory only.',flush=True)
import uvicorn
uvicorn.run(app,host='127.0.0.1',port=8067,log_level='warning',access_log=False)
