import { ApartmentOwnerPage, apartmentOwnerMetadata } from "../../../../../../components/shida/marketplace-pages";
import { isServiceLocale } from "../../../../../../lib/services-i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; owner: string }> }) {
  const { lang, owner } = await params;
  return apartmentOwnerMetadata(isServiceLocale(lang) ? lang : "en", owner);
}

export default async function Page({ params }: { params: Promise<{ lang: string; owner: string }> }) {
  const { lang, owner } = await params;
  return <ApartmentOwnerPage locale={isServiceLocale(lang) ? lang : "en"} owner={owner}/>;
}
