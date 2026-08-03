import type { Metadata } from "next";
import { SiteDocument } from "../components/site-document";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nihiloba.com"),
  title: { default: "NIHILOBA", template: "%s | NIHILOBA" },
  description: "NIHILOBA develops practical digital technology rooted in real needs.",
  openGraph: { type: "website", siteName: "NIHILOBA", images: ["https://nihiloba.com/NIHILOBA_logo.png"] },
  twitter: { card: "summary_large_image", images: ["https://nihiloba.com/NIHILOBA_logo.png"] },
};

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale="en">{children}</SiteDocument>;
}
