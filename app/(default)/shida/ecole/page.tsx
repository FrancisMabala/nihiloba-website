import { SchoolEntry, schoolEntryMetadata } from '@/app/components/shida/school-entry';
import { listPublicSchools } from '@/app/services/shida/schools';

export const metadata = schoolEntryMetadata('en');

export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}) { const page=Number((await searchParams).page??'1'); return <SchoolEntry locale="en" page={page} listing={await listPublicSchools('en',page)} />; }
