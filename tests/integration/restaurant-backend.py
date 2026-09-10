"""Local S3-A harness: real Backend app/PostgreSQL, synthetic sessions, no delivery.

Only the dedicated disposable database is accepted. Never load Backend .env.
Run with Backend's venv Python from the website root. Test controls are local
fixtures only and are not imported by the production application.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT.parent / "Backend"
os.environ["DATABASE_URL"] = "postgresql://s3a:isolated_test_only@127.0.0.1:55439/restaurant_r0a_test?connect_timeout=5"
os.environ["APP_ENV"] = "test"
os.environ["WHATSAPP_VERIFY_TOKEN"] = "isolated-no-delivery"
os.environ["ADMIN_KEY"] = "isolated-s3a-not-production"
os.environ["DASHBOARD_AUTH_PEPPER"] = "isolated-s3a-not-production"
sys.path.insert(0, str(BACKEND))
# Disable dotenv before importing any Backend settings. No production secrets.
from pydantic_settings import BaseSettings
BaseSettings.model_config["env_file"] = None
original_init = BaseSettings.__init__
def no_dotenv(self, *args, **kwargs):
    kwargs["_env_file"] = None
    original_init(self, *args, **kwargs)
BaseSettings.__init__ = no_dotenv

# Prevent external connections even during application import/startup.
import socket
original_connect = socket.socket.connect
def isolated_connect(self, address):
    if isinstance(address, tuple) and address[0] not in ("127.0.0.1", "::1"):
        raise RuntimeError("External network forbidden in S3-A harness")
    return original_connect(self, address)
socket.socket.connect = isolated_connect

from app.main import app
from app.config import settings
from app.database.connection import SessionLocal
from app.database.models import UserAccountDB, DashboardSessionDB, FoodBusinessDB
from app.services.dashboard_auth_service import _keyed_hash
from app.services.restaurant_lifecycle_service import update_personal_profile
from app.services.vertical_marketplace_service import create_food_business
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from fastapi import HTTPException

settings.public_base_url = "https://api.nihiloba.com"
settings.shida_whatsapp_number = "243000000000"  # Never send or follow externally.

actors = {}
for label, phone in (("personal", "243000000001"), ("other", "243000000002")):
    with SessionLocal() as db:
        account = db.query(UserAccountDB).filter_by(phone_number=phone).first()
        if not account:
            account = UserAccountDB(phone_number=phone)
            db.add(account); db.commit()
        actors[label] = dict(actor_account_id=account.id, actor_account_ref=account.public_ref, active_business_id=None)

@app.post("/__s3a/session/{label}")
def synthetic_session(label: str):
    if label not in actors: raise HTTPException(404)
    token = uuid4().hex
    with SessionLocal() as db:
        db.add(DashboardSessionDB(account_id=actors[label]["actor_account_id"], token_hash=_keyed_hash("dashboard-session", token), last_seen_at=datetime.now(timezone.utc), expires_at=datetime.now(timezone.utc)+timedelta(hours=1)))
        db.commit()
    return {"token": token}

@app.post("/__s3a/expire")
def expire():
    with SessionLocal() as db:
        db.query(DashboardSessionDB).update({"expires_at": datetime.now(timezone.utc)-timedelta(seconds=1)})
        db.commit()
    return {"ok": True}

@app.post("/__s3a/cross-channel/{ref}")
def cross_channel(ref: str):
    with SessionLocal() as db:
        row = db.query(FoodBusinessDB).filter_by(public_ref=ref).one()
        revision = row.updated_at.isoformat()
    # Same authoritative service used by WhatsApp. NOT a live WhatsApp event.
    result = update_personal_profile(**actors["personal"], profile_ref=ref, expected_updated_at=revision, fields={"description": "Synthetic cross-channel edit"})
    return {"ok": bool(result)}

if __name__ == "__main__":
    if "--checks" in sys.argv:
        import pytest
        files = ["test_restaurant_personal_api.py", "test_restaurant_personal_lifecycle.py", "test_restaurant_personal_menu.py", "test_restaurant_personal_api_postgres.py", "test_restaurant_personal_lifecycle_postgres.py", "test_restaurant_personal_menu_postgres.py", "test_restaurant_personal_whatsapp.py", "test_restaurant_personal_menu_whatsapp.py"]
        raise SystemExit(pytest.main([*[str(BACKEND / "tests" / file) for file in files], "-q", "-p", "no:cacheprovider"]))
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3443, ssl_keyfile=str(ROOT / ".s3a-local/key.pem"), ssl_certfile=str(ROOT / ".s3a-local/cert.pem"), access_log=False)
