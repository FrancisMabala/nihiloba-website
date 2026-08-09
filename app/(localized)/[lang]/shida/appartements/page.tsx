import { ApartmentCollectionPage, apartmentCollectionMetadata } from "../../../../components/shida/marketplace-pages";
import { isLocale } from "../../../../lib/i18n";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return apartmentCollectionMetadata(isLocale(lang) ? lang : "en"); }
export default async function Page({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return <ApartmentCollectionPage locale={isLocale(lang) ? lang : "en"}/>; }
