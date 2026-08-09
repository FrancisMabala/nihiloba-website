import { HotelCollectionPage, hotelCollectionMetadata } from "../../../components/shida/marketplace-pages";
export const revalidate = 60;
export const metadata = hotelCollectionMetadata("en");
export default function Page() { return <HotelCollectionPage locale="en"/>; }
