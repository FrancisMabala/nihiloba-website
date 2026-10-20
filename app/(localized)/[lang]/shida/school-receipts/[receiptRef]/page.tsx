import { notFound } from 'next/navigation';
import { SchoolReceiptVerification } from '@/app/components/shida/school-receipt-verification';
import { verifySchoolReceipt } from '@/app/services/shida/school-receipts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'SHIDA École', robots: { index: false, follow: false, noarchive: true } };

export default async function Page({ params }: { params: Promise<{ lang: string; receiptRef: string }> }) {
  const { lang, receiptRef } = await params;
  if (!['fr', 'en', 'ln', 'sw'].includes(lang)) notFound();
  const result = await verifySchoolReceipt(receiptRef);
  return <SchoolReceiptVerification locale={lang as 'fr' | 'en' | 'ln' | 'sw'} result={result} />;
}
