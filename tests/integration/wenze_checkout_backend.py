"""Copy into an isolated backend checkout's tests/ and run with its normal pytest.

WENZE_WEBSITE_ROOT points to the built website. No production API or DB is used.
The backend pytest environment owns and removes its disposable SQLite database.
"""
import json
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from io import BytesIO

from pypdf import PdfReader
from tests.test_wenze_pos import priced_api, base_priced_api  # noqa: F401
from tests.test_wenze_priced_physical_sales import _product
from app.database.connection import SessionLocal, engine
from app.database.inventory_models import WenzeSaleReceiptDB, WenzePricedPhysicalSaleDB, StockBalanceDB


def test_browser_sale_stock_history_payment_receipt(priced_api, tmp_path):
    assert engine.url.get_backend_name() == 'sqlite'
    assert 'shida-pytest-' in str(engine.url.database)
    client, base, store, product, phone = priced_api
    _product(store['id'], phone, name='Controlled basket second product')
    website = Path(os.environ['WENZE_WEBSITE_ROOT']).resolve()
    corrupted = False

    class Bridge(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            self.forward()

        def do_POST(self):
            self.forward()

        def forward(self):
            nonlocal corrupted
            # Only POS paths for this fixture shop are reachable through the bridge.
            if not self.path.startswith('/pos/'):
                self.send_error(404)
                return
            body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            response = client.request(self.command, base + self.path, content=body,
                headers={'Content-Type': 'application/json',
                         'Idempotency-Key': self.headers.get('Idempotency-Key', '')})
            data = response.content
            if self.path == '/pos/checkout' and response.status_code == 200 and not corrupted:
                # Sale committed, but the browser cannot decode the response.
                corrupted = True
                data = b'{'
            self.send_response(response.status_code)
            for key in ('content-type', 'content-disposition'):
                if key in response.headers:
                    self.send_header(key, response.headers[key])
            self.end_headers()
            self.wfile.write(data)

    server = ThreadingHTTPServer(('127.0.0.1', 0), Bridge)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        env = dict(os.environ, WENZE_TEST_BRIDGE=f'http://127.0.0.1:{server.server_port}',
                   WENZE_TEST_STORE=store['public_ref'])
        result = subprocess.run(['node', 'node_modules/@playwright/test/cli.js', 'test',
                                 '-c', 'playwright.wenze-checkout-integration.config.ts'],
                                cwd=website, env=env, capture_output=True, text=True, timeout=180)
        assert result.returncode == 0, result.stdout + result.stderr
    finally:
        server.shutdown()
        server.server_close()
        thread.join()

    history = client.get(base + '/pos/receipts').json()
    assert history['total'] == 3, history
    with SessionLocal() as db:
        assert db.query(WenzeSaleReceiptDB).count() == 3
        assert db.query(WenzePricedPhysicalSaleDB).count() == 6
        assert sorted(row.on_hand for row in db.query(StockBalanceDB).all()) == [4, 7]
    for receipt in history['receipts']:
        assert receipt['totals'] == [{'currency': 'CDF', 'amount': '9000.00'}]
        assert sorted(row['quantity'] for row in receipt['lines']) == [1, 2]
        canonical = client.get(base + '/pos/receipts/' + receipt['receipt_ref']).json()
        assert canonical.pop('qr_image').startswith('data:image/png;base64,')
        assert canonical == receipt
        if receipt['payment'] == 'seller_recorded_cash':
            assert receipt['payment_details'] == {'received': {'CDF': '10000.00'}, 'change': {'CDF': '1000.00'}}
        else:
            assert receipt['payment_details']['reference'] == 'CONTROLLED-EXTERNAL'
        for width in (58, 80):
            pdf = client.get(base + '/pos/receipts/' + receipt['receipt_ref'] + f'/pdf?language=en&width={width}')
            assert pdf.status_code == 200
            document = PdfReader(BytesIO(pdf.content))
            text = ''.join(page.extract_text() for page in document.pages)
            assert receipt['receipt_ref'] in text and '9000.00 CDF' in text
            assert abs(float(document.pages[0].mediabox.width) - width * 72 / 25.4) < 1
            if receipt['payment'] == 'seller_recorded_cash':
                assert '10000.00' in text and '1000.00' in text
            else:
                assert 'CONTROLLED-EXTERNAL' in text
    evidence = {'receipts': history['receipts'], 'stock_after': [4, 7], 'sale_lines': 6,
                'committed_receipts': 3, 'truncated_response_replayed_once': corrupted}
    (website / 'test-results' / 'checkout-integration-evidence.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
