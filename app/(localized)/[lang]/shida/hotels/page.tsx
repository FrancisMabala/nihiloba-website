import { parseHotelSearch } from "../../../../lib/hotel-search";
import { HotelCollectionPage, hotelCollectionMetadata } from "../../../../components/shida/marketplace-pages";
import { isLocale } from "../../../../lib/i18n";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return hotelCollectionMetadata(isLocale(lang) ? lang : "en"); }
export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const [{lang},search] = await Promise.all([params,searchParams]);
  return <HotelCollectionPage locale={isLocale(lang)?lang:"en"} search={parseHotelSearch(search)}/>;
}
