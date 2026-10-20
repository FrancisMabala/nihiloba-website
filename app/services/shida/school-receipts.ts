export type SchoolReceiptStatus = 'valid_school_recorded' | 'reversed' | 'refunded';
export type SchoolReceiptVerification = {
  receipt_ref: string;
  receipt_number: string;
  status: SchoolReceiptStatus;
};
export type SchoolReceiptResult =
  | { kind: 'found'; receipt: SchoolReceiptVerification }
  | { kind: 'missing' | 'unavailable' };

const REF = /^SRCPT_[A-Za-z0-9_-]{6,64}$/;

export async function verifySchoolReceipt(receiptRef: string): Promise<SchoolReceiptResult> {
  if (!REF.test(receiptRef)) return { kind: 'missing' };
  let origin: string;
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? 'https://api.nihiloba.com');
    if (base.protocol !== 'https:' || base.username || base.password) return { kind: 'unavailable' };
    origin = base.origin;
  } catch {
    return { kind: 'unavailable' };
  }
  try {
    const response = await fetch(`${origin}/api/public/education/receipts/${encodeURIComponent(receiptRef)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (response.status === 404) return { kind: 'missing' };
    if (!response.ok) return { kind: 'unavailable' };
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { kind: 'unavailable' };
    const item = value as Record<string, unknown>;
    if (Object.keys(item).sort().join(',') !== 'receipt_number,receipt_ref,status' ||
      item.receipt_ref !== receiptRef || typeof item.receipt_number !== 'string' ||
      !item.receipt_number || item.receipt_number.length > 80 ||
      !['valid_school_recorded', 'reversed', 'refunded'].includes(String(item.status))) {
      return { kind: 'unavailable' };
    }
    return { kind: 'found', receipt: item as SchoolReceiptVerification };
  } catch {
    return { kind: 'unavailable' };
  }
}
