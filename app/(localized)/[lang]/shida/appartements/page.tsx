import { ApartmentCollectionPage, apartmentCollectionMetadata } from "../../../../components/shida/marketplace-pages";
import { isServiceLocale } from "../../../../lib/services-i18n";
import { parseApartmentSearchParams, type ApartmentRawSearchParams } from "../../../../services/shida/public-client";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return apartmentCollectionMetadata(isServiceLocale(lang) ? lang : "en"); }
export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<ApartmentRawSearchParams> }) {
  const { lang } = await params;
  return <ApartmentCollectionPage locale={isServiceLocale(lang) ? lang : "en"} search={parseApartmentSearchParams(await searchParams)}/>;
}
