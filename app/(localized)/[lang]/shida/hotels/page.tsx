import { HotelCollectionPage, hotelCollectionMetadata } from "../../../../components/shida/marketplace-pages";
import { isLocale } from "../../../../lib/i18n";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return hotelCollectionMetadata(isLocale(lang) ? lang : "en"); }
export default async function Page({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return <HotelCollectionPage locale={isLocale(lang) ? lang : "en"}/>; }
