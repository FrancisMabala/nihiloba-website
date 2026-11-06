import { Suspense } from 'react';
import { SchoolEntry, SchoolDirectoryLoading, schoolEntryMetadata } from '@/app/components/shida/school-entry';
import { SchoolDirectoryLoader } from '@/app/components/shida/school-directory-loader';

export const metadata = schoolEntryMetadata('en');

export default function Page({searchParams}:{searchParams:Promise<{page?:string}>}) {
  return <SchoolEntry locale="en" directory={<Suspense fallback={<SchoolDirectoryLoading locale="en"/>}><SchoolDirectoryLoader locale="en" searchParams={searchParams}/></Suspense>}/>;
}
