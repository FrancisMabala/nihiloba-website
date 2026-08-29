import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WenzeCartPage } from "../../../../../components/shida/wenze-cart-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panier Wenze", robots: { index: false, follow: false }, alternates: { canonical: "/fr/shida/wenze/panier" } };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; if (lang !== "fr") notFound(); return <WenzeCartPage locale="fr"/>; }
