import { ApartmentCollectionPage, apartmentCollectionMetadata } from "../../../components/shida/marketplace-pages";
export const revalidate = 60;
export const metadata = apartmentCollectionMetadata("en");
export default function Page() { return <ApartmentCollectionPage locale="en"/>; }
