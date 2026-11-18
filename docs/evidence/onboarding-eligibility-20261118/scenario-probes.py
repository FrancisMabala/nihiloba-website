"""Audit-only synthetic probes; no provider calls or production configuration.

Run through scripts/run_platform_validation.py, never against an ambient DB.
"""
import pytest
from app.database.connection import SessionLocal
from app.database.models import UserAccountDB
from app.services.personal_onboarding_service import PersonalOnboardingService
from app.services.dashboard_auth_service import _account_can_use_dashboard
from app.services import meda_service as meda
from tests.test_web_registration import configure, verified
from tests.test_dashboard_whatsapp_auth import _account
from tests.test_business_onboarding_creator_identity import _accept, VALUES
from app.services.organization_onboarding_service import OrganizationOnboardingService
from tests.test_meda import data


@pytest.mark.parametrize('phone,country,city,commune', [
    ('46700009101', 'SE', 'Stockholm', None),
    ('243910009102', 'SE', 'Stockholm', None),
    ('46700009103', 'CD', 'Kinshasa', 'Gombe'),
])
def test_registration_keeps_residence_independent_of_phone(client, phone, country, city, commune):
    verified(client, phone)
    state = client.post('/api/dashboard/registration/personal', json={'language':'fr'}).json()
    ref = state['onboarding_ref']
    response = client.patch(f'/api/dashboard/registration/personal/{ref}', json={
        'revision':state['revision'], 'language':'fr',
        'values':{'first_name':'Audit', 'family_name':'Person', 'country_code':country,
                  'city':city, 'commune':commune},
        'accept_documents':{d['document_type']:d['version'] for d in state['legal']},
    })
    assert response.status_code == 200, response.text
    state = response.json()
    assert state['can_complete'], state
    assert client.post(f'/api/dashboard/registration/personal/{ref}/complete', json={'revision':state['revision']}).status_code == 200
    assert client.post('/api/dashboard/registration/finish/session').status_code == 200
    assert client.get('/api/dashboard/me').status_code == 200
    with SessionLocal() as db:
        actor = db.query(UserAccountDB).one()
        assert (actor.phone_number, actor.country_code) == (phone, country)


def test_combined_declaration_is_required_without_demographic_validation(client):
    assert client.post('/api/dashboard/registration/challenge').status_code == 422
    assert client.post('/api/dashboard/registration/challenge', headers={'X-Shida-Eligibility':'adult-drc-v1'}).status_code == 201


def test_existing_foreign_account_login_and_profile_remain_available():
    actor = _account('46700009104', 'Audit Existing')
    with SessionLocal() as db:
        row = db.get(UserAccountDB, actor.id)
        row.country_code, row.city = 'SE', 'Stockholm'
        db.commit()
        assert _account_can_use_dashboard(db, row)
        service = PersonalOnboardingService(db, row.id)
        assert service.state()['existing_account']
        profile = service.profile()
        updated = service.update_profile(revision=profile['revision'], values={'city':'Uppsala'})
        assert updated['values']['country_code'] == 'SE'


def test_incomplete_foreign_account_resumes_web_draft_without_second_identity():
    actor = _account('46700009105', None)
    with SessionLocal() as db:
        service = PersonalOnboardingService(db, actor.id)
        state = service.start()
        state = service.update(state['onboarding_ref'], revision=state['revision'], language='fr',
                               values={'country_code':'SE','city':'Stockholm'})
        assert not _account_can_use_dashboard(db, db.get(UserAccountDB, actor.id))
        resumed = service.start()
        assert resumed['onboarding_ref'] == state['onboarding_ref']
        assert resumed['values']['country_code'] == 'SE'
        assert db.query(UserAccountDB).count() == 1


def test_meda_accepts_foreign_resident_and_route_without_drc_endpoint():
    actor = _account('46700009106', 'Audit Meda')
    with SessionLocal() as db:
        row = db.get(UserAccountDB, actor.id)
        row.country_code, row.city = 'SE', 'Stockholm'
        db.commit()
        values = data()
        values.update(origin_country='SE', origin_city='Stockholm', destination_country='FR', destination_city='Paris')
        draft = meda.create(db, row.id, row.public_ref, values, 'audit-route')
        published = meda.change(db, row.id, row.public_ref, draft['reference'], 'publish', draft['revision'])
        db.commit()
        assert published['status'] == 'published'
        assert meda.discover(db, account_id=row.id, account_ref=row.public_ref)['items'][0]['origin_country'] == 'SE'


def test_foreign_resident_creator_and_drc_organization_remain_distinct():
    actor = _account('46700009107', 'Audit Creator')
    with SessionLocal() as db:
        row = db.get(UserAccountDB, actor.id)
        row.country_code, row.city = 'SE', 'Stockholm'
        db.commit()
        _accept(db, row, 'BUS_AUDIT_RESIDENCE')
        business = OrganizationOnboardingService(db, row.id).complete(
            organization_ref='BUS_AUDIT_RESIDENCE',
            values={**VALUES, 'personal_name':row.personal_name, 'quartier_or_area':'Audit quartier'},
        )
        assert business.country_code == 'CD'
        assert row.country_code == 'SE' and row.city == 'Stockholm'
        assert business.creator_personal_account_id == row.id
