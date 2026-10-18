import { notFound } from "next/navigation";
import { ShidaInformationPage, informationMetadata } from "../../../../components/pages/shida-information-page";
import { isLocale } from "../../../../lib/i18n";
type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) { const { lang } = await params; if (!isLocale(lang)) notFound(); return informationMetadata(lang, "transport"); }
export default async function Page({ params }: Props) { const { lang } = await params; if (!isLocale(lang)) notFound(); return <ShidaInformationPage locale={lang} kind="transport" />; }
