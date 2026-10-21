import { notFound } from 'next/navigation';
import { SchoolEntry, schoolEntryMetadata, type SchoolEntryLocale } from '@/app/components/shida/school-entry';

type Props = { params: Promise<{ lang: string }> };
const isSchoolLocale = (lang: string): lang is SchoolEntryLocale => ['en', 'fr', 'ln', 'sw'].includes(lang);

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isSchoolLocale(lang)) notFound();
  return schoolEntryMetadata(lang);
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isSchoolLocale(lang)) notFound();
  return <SchoolEntry locale={lang} />;
}
