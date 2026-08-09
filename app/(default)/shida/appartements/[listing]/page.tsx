import { ApartmentDetailPage, apartmentDetailMetadata } from "../../../../components/shida/marketplace-pages";
export async function generateMetadata({ params }: { params: Promise<{ listing: string }> }) { const { listing } = await params; return apartmentDetailMetadata("en", listing); }
export default async function Page({ params }: { params: Promise<{ listing: string }> }) { const { listing } = await params; return <ApartmentDetailPage locale="en" slug={listing}/>; }
