import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchoolReceiptVerification } from '../app/components/shida/school-receipt-verification';
import { verifySchoolReceipt } from '../app/services/shida/school-receipts';

const ref = 'SRCPT_ABC12345';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('School receipt status lookup', () => {
  it('fetches only an opaque reference with no cache and parses current status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      receipt_ref: ref, receipt_number: '2026–2027-000001', status: 'reversed',
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifySchoolReceipt(ref)).toEqual({ kind: 'found', receipt: {
      receipt_ref: ref, receipt_number: '2026–2027-000001', status: 'reversed',
    } });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.nihiloba.com/api/public/education/receipts/${ref}`,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('keeps unavailable distinct from an unknown receipt and rejects extra private fields', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 404 }))
      .mockResolvedValueOnce(new Response('{}', { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        receipt_ref: ref, receipt_number: '2026–2027-000001',
        status: 'valid_school_recorded', student_name: 'private',
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifySchoolReceipt(ref)).toEqual({ kind: 'missing' });
    expect(await verifySchoolReceipt(ref)).toEqual({ kind: 'unavailable' });
    expect(await verifySchoolReceipt(ref)).toEqual({ kind: 'unavailable' });
    expect(await verifySchoolReceipt('../unsafe')).toEqual({ kind: 'missing' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('fails closed on bad API configuration or network failure', async () => {
    vi.stubEnv('SHIDA_API_BASE_URL', 'http://wrong.example');
    expect(await verifySchoolReceipt(ref)).toEqual({ kind: 'unavailable' });
    vi.stubEnv('SHIDA_API_BASE_URL', 'https://api.nihiloba.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await verifySchoolReceipt(ref)).toEqual({ kind: 'unavailable' });
  });

  it('renders the current outcome in each released language without raw statuses', () => {
    const labels = {
      fr: 'Paiement remboursé', en: 'Payment refunded',
      ln: 'Mbongo ya lifuti ezongisami', sw: 'Malipo yamerejeshwa',
    };
    for (const locale of ['fr', 'en', 'ln', 'sw'] as const) {
      const html = renderToStaticMarkup(createElement(SchoolReceiptVerification, {
        locale, result: { kind: 'found', receipt: {
          receipt_ref: ref, receipt_number: '2026–2027-000001', status: 'refunded',
        } },
      }));
      expect(html).toContain('2026–2027-000001');
      expect(html).toContain(labels[locale]);
      expect(html).not.toContain('>refunded<');
      expect(html).not.toContain('student_name');
    }
  });
});
