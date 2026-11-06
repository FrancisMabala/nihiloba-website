import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SchoolEntry, SchoolDirectoryLoading, schoolEntryMetadata, type SchoolEntryLocale } from '@/app/components/shida/school-entry';
import { SchoolDirectoryLoader } from '@/app/components/shida/school-directory-loader';

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
  return <SchoolEntry locale={lang} directory={<Suspense fallback={<SchoolDirectoryLoading locale={lang}/>}><SchoolDirectoryLoader locale={lang} searchParams={searchParams}/></Suspense>}/>;
}
