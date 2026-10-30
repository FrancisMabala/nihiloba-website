"""Disposable mixed transaction browser fixture, never a production seed."""
import os, sys
from pathlib import Path
from tempfile import TemporaryDirectory
from datetime import datetime, timedelta, timezone
from pydantic_settings import BaseSettings
original=BaseSettings.__init__
def isolated(self,*args,**kw):
    kw['_env_file']=None
    original(self,*args,**kw)
BaseSettings.__init__=isolated
root=Path(sys.argv[1]).resolve()
assert (root/'tests/transactions_fixture_support.py').is_file()
sys.path.insert(0,str(root))
fixture_directory=TemporaryDirectory(prefix='shida-transactions-')
os.environ.update(APP_ENV='test',DATABASE_URL='sqlite:///'+str(Path(fixture_directory.name)/'transactions.db'),WHATSAPP_VERIFY_TOKEN='local-test-only',DASHBOARD_AUTH_PEPPER='transactions-local-test-only',ADMIN_KEY='local-test-only')
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import DashboardSessionDB
from app.services.dashboard_auth_service import _keyed_hash
from tests.transactions_fixture_support import account, mixed, application
accounts={'empty':account('243820099901','Empty acceptance'),'one':account('243820099902','One acceptance')}
accounts['many']=mixed()[0]
accounts['pages']=account('243820099903','History acceptance')
with SessionLocal() as db:
    application(db,accounts['one'],'one_acceptance',datetime.now(timezone.utc))
    for number in range(12):application(db,accounts['pages'],'history_'+str(number),datetime.now(timezone.utc)-timedelta(days=number))
    for kind,who in accounts.items():
        db.add(DashboardSessionDB(account_id=who['actor_account_id'],token_hash=_keyed_hash('dashboard-session','transactions-acceptance-'+kind+'-session'),last_seen_at=datetime.now(timezone.utc),expires_at=datetime.now(timezone.utc)+timedelta(hours=4)))
    db.commit()
print('Disposable transaction fixtures ready; no production data used.',flush=True)
import uvicorn
uvicorn.run(app,host='127.0.0.1',port=8058,log_level='warning',access_log=False)
