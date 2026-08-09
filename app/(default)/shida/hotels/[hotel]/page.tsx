import { HotelDetailPage, hotelDetailMetadata } from "../../../../components/shida/marketplace-pages";
export async function generateMetadata({ params }: { params: Promise<{ hotel: string }> }) { const { hotel } = await params; return hotelDetailMetadata("en", hotel); }
export default async function Page({ params }: { params: Promise<{ hotel: string }> }) { const { hotel } = await params; return <HotelDetailPage locale="en" slug={hotel}/>; }
