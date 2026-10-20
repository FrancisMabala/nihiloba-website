import { SchoolReceiptVerification } from '@/app/components/shida/school-receipt-verification';
import { verifySchoolReceipt } from '@/app/services/shida/school-receipts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'SHIDA École', robots: { index: false, follow: false, noarchive: true } };

export default async function Page({ params }: { params: Promise<{ receiptRef: string }> }) {
  const { receiptRef } = await params;
  const result = await verifySchoolReceipt(receiptRef);
  return <SchoolReceiptVerification locale="en" result={result} />;
}
