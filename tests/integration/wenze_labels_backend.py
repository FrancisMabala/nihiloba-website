"""Run with the backend's disposable test environment and tests.conftest plugin."""
from tests.test_wenze_pos import priced_api, base_priced_api  # noqa: F401
from tests.test_wenze_priced_physical_sales import _actor
from app.database.connection import SessionLocal
from app.database.inventory_models import InventoryItemDB, WenzeInventoryBindingDB
from app.services import wenze_print_service as printing, wenze_pos_service as pos


def test_existing_product_and_legacy_inventory_labels_stay_stable(priced_api):
    client, base, store, product, phone = priced_api
    with SessionLocal() as db:
        target = db.query(InventoryItemDB).join(
            WenzeInventoryBindingDB,
            WenzeInventoryBindingDB.item_id == InventoryItemDB.id,
        ).filter(WenzeInventoryBindingDB.product_id == product['id']).one()
        legacy = target.operational_code
        assert legacy.startswith('INV-')
        first = printing.label(db, store_ref=store['public_ref'], actor=_actor(phone), code=legacy)
        again = printing.label(db, store_ref=store['public_ref'], actor=_actor(phone), code=product['public_ref'])
        assert first['barcode'] == again['barcode'] == product['public_ref']
        assert first['bars'] == again['bars']
        assert pos.lookup(db, store_ref=store['public_ref'], actor=_actor(phone), code=legacy)['product_ref'] == product['public_ref']
        assert printing.labels_pdf([(again, 2)]).startswith(b'%PDF')


def test_variant_labels_use_separate_existing_codes(priced_api):
    from tests.wenze_fixture_support import create_wenze_product
    client, base, store, product, phone = priced_api
    created = create_wenze_product({'store_id':store['id'],'owner_phone':phone,'name':'Label variants','category':'fashion_clothing','price':'5','currency':'USD','stock_quantity':None,'variant_type':'size','variants':[{'label':'S','stock_quantity':2},{'label':'M','stock_quantity':3}]})
    with SessionLocal() as db:
        targets = [p for p in pos.catalog(db,store_ref=store['public_ref'],actor=_actor(phone))['items'] if p['product_ref']==created['public_ref']]
        assert len(targets)==2
        labels=[printing.label(db,store_ref=store['public_ref'],actor=_actor(phone),code=p['barcode']) for p in targets]
        assert len({p['barcode'] for p in labels})==2
        for label in labels:
            assert label['barcode']==label['variant_ref']
            assert pos.lookup(db,store_ref=store['public_ref'],actor=_actor(phone),code=label['barcode'])['variant_ref']==label['variant_ref']
