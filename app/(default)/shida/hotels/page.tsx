import { parseHotelSearch } from "../../../lib/hotel-search";
import { HotelCollectionPage, hotelCollectionMetadata } from "../../../components/shida/marketplace-pages";
export const revalidate = 60;
export const metadata = hotelCollectionMetadata("en");
export default async function Page({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  return <HotelCollectionPage locale="en" search={parseHotelSearch(await searchParams)}/>;
}
