import { listPublicSchools } from '@/app/services/shida/schools';
import { SchoolDirectory, type SchoolEntryLocale } from './school-entry';

/** Only the reviewed public projection is requested, behind its own Suspense boundary. */
export async function SchoolDirectoryLoader({ locale, searchParams }: {
  locale: SchoolEntryLocale; searchParams: Promise<{ page?: string }>;
}) {
  const page = Number((await searchParams).page ?? '1');
  return <SchoolDirectory locale={locale} page={page} listing={await listPublicSchools(locale, page)}/>;
}
