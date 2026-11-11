import { HotelDetailPage, hotelDetailMetadata } from "../../../../../components/shida/marketplace-pages";
import { isServiceLocale } from "../../../../../lib/services-i18n";
export async function generateMetadata({ params }: { params: Promise<{ lang: string; hotel: string }> }) { const { lang, hotel } = await params; return hotelDetailMetadata(isServiceLocale(lang) ? lang : "en", hotel); }
export default async function Page({ params }: { params: Promise<{ lang: string; hotel: string }> }) { const { lang, hotel } = await params; return <HotelDetailPage locale={isServiceLocale(lang) ? lang : "en"} slug={hotel}/>; }
