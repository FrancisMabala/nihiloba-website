import { ShidaStoryPage } from "../../../../components/pages/shida-story-page";
import { pageMetadata } from "../../../../lib/i18n";
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params, locale = lang === "en" ? "en" : "fr", path = locale === "en" ? "/about/shida" : "/fr/about/shida";
  return { ...pageMetadata(locale, "shida", "/shida"), title: locale === "en" ? "The story of SHIDA" : "L’histoire de SHIDA", alternates: { canonical: path, languages: { en: "/about/shida", fr: "/fr/about/shida" } }, openGraph: { url: path } };
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return <ShidaStoryPage locale={lang === "en" ? "en" : "fr"}/>; }
