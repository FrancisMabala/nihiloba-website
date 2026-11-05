import { ApartmentDetailPage, apartmentDetailMetadata } from "../../../../../components/shida/marketplace-pages";
import { isServiceLocale } from "../../../../../lib/services-i18n";
export async function generateMetadata({ params }: { params: Promise<{ lang: string; listing: string }> }) { const { lang, listing } = await params; return apartmentDetailMetadata(isServiceLocale(lang) ? lang : "en", listing); }
export default async function Page({ params }: { params: Promise<{ lang: string; listing: string }> }) { const { lang, listing } = await params; return <ApartmentDetailPage locale={isServiceLocale(lang) ? lang : "en"} slug={listing}/>; }
