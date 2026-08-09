import { ApartmentOwnerPage, apartmentOwnerMetadata } from "../../../../../../components/shida/marketplace-pages";
import { isLocale } from "../../../../../../lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; owner: string }> }) {
  const { lang, owner } = await params;
  return apartmentOwnerMetadata(isLocale(lang) ? lang : "en", owner);
}

export default async function Page({ params }: { params: Promise<{ lang: string; owner: string }> }) {
  const { lang, owner } = await params;
  return <ApartmentOwnerPage locale={isLocale(lang) ? lang : "en"} owner={owner}/>;
}
