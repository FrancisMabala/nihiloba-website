import { ApartmentCollectionPage, apartmentCollectionMetadata } from "../../../../components/shida/marketplace-pages";
import { isLocale } from "../../../../lib/i18n";
import { parseApartmentSearchParams, type ApartmentRawSearchParams } from "../../../../services/shida/public-client";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return apartmentCollectionMetadata(isLocale(lang) ? lang : "en"); }
export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<ApartmentRawSearchParams> }) {
  const { lang } = await params;
  return <ApartmentCollectionPage locale={isLocale(lang) ? lang : "en"} search={parseApartmentSearchParams(await searchParams)}/>;
}
