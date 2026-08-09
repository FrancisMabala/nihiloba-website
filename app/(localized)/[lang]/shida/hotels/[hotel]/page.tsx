import { HotelDetailPage, hotelDetailMetadata } from "../../../../../components/shida/marketplace-pages";
import { isLocale } from "../../../../../lib/i18n";
export async function generateMetadata({ params }: { params: Promise<{ lang: string; hotel: string }> }) { const { lang, hotel } = await params; return hotelDetailMetadata(isLocale(lang) ? lang : "en", hotel); }
export default async function Page({ params }: { params: Promise<{ lang: string; hotel: string }> }) { const { lang, hotel } = await params; return <HotelDetailPage locale={isLocale(lang) ? lang : "en"} slug={hotel}/>; }
