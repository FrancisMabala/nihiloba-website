import { notFound } from "next/navigation";
import { ShidaVersionedLegalPage } from "../../../../../../components/legal/shida-versioned-legal-page";
import { getShidaLegalMetadata, shidaLegalPageMetadata } from "../../../../../../lib/shida-legal";

export function generateStaticParams() { return [{ version: "1.0" }]; }
export async function generateMetadata({ params }: { params: Promise<{ version: string }> }) { const document = getShidaLegalMetadata("business-terms", "fr", (await params).version); return document ? shidaLegalPageMetadata(document, true) : {}; }
export default async function Page({ params }: { params: Promise<{ lang: string; version: string }> }) { const { lang, version } = await params; if (lang !== "fr") notFound(); return <ShidaVersionedLegalPage kind="business-terms" locale="fr" version={version} historical/>; }
