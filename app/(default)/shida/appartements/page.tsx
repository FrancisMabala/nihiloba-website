import { ApartmentCollectionPage, apartmentCollectionMetadata } from "../../../components/shida/marketplace-pages";
import { parseApartmentSearchParams, type ApartmentRawSearchParams } from "../../../services/shida/public-client";
export const revalidate = 60;
export const metadata = apartmentCollectionMetadata("en");
export default async function Page({ searchParams }: { searchParams: Promise<ApartmentRawSearchParams> }) {
  return <ApartmentCollectionPage locale="en" search={parseApartmentSearchParams(await searchParams)}/>;
}
