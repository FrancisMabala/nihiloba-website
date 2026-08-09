import { ApartmentDetailPage, apartmentDetailMetadata } from "../../../../../components/shida/marketplace-pages";
import { isLocale } from "../../../../../lib/i18n";
export async function generateMetadata({ params }: { params: Promise<{ lang: string; listing: string }> }) { const { lang, listing } = await params; return apartmentDetailMetadata(isLocale(lang) ? lang : "en", listing); }
export default async function Page({ params }: { params: Promise<{ lang: string; listing: string }> }) { const { lang, listing } = await params; return <ApartmentDetailPage locale={isLocale(lang) ? lang : "en"} slug={listing}/>; }
