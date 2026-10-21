import { SchoolEntry, schoolEntryMetadata } from '@/app/components/shida/school-entry';

export const metadata = schoolEntryMetadata('en');

export default function Page() { return <SchoolEntry locale="en" />; }
