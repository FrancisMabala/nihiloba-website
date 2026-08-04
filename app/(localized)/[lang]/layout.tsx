import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "../../components/site-document";
import { isLocale, locales } from "../../lib/i18n";
import "../../globals.css";

export const dynamicParams = false;
export function generateStaticParams() { return locales.map((lang) => ({ lang })); }

export const metadata: Metadata = {
  metadataBase: new URL("https://nihiloba.com"),
  title: { default: "NIHILOBA", template: "%s | NIHILOBA" },
  openGraph: { type: "website", siteName: "NIHILOBA", images: [{ url: "/NIHILOBA_logo.png", width: 1536, height: 1024, alt: "NIHILOBA — Roots. Impact. Future." }] },
  twitter: { card: "summary_large_image", images: [{ url: "/NIHILOBA_logo.png", alt: "NIHILOBA — Roots. Impact. Future." }] },
};

export default async function LocalizedLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <SiteDocument locale={lang}>{children}</SiteDocument>;
}
