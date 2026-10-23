import { notFound } from 'next/navigation';
import { SchoolEntry, schoolEntryMetadata, type SchoolEntryLocale } from '@/app/components/shida/school-entry';
import { listPublicSchools } from '@/app/services/shida/schools';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{page?:string}> };
const isSchoolLocale = (lang: string): lang is SchoolEntryLocale => ['en', 'fr', 'ln', 'sw'].includes(lang);

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  if (!isSchoolLocale(lang)) notFound();
  return schoolEntryMetadata(lang);
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isSchoolLocale(lang)) notFound();
  const page=Number((await searchParams).page??'1');
  return <SchoolEntry locale={lang} page={page} listing={await listPublicSchools(lang,page)} />;
}
