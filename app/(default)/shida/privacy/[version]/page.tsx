import { ShidaVersionedLegalPage } from "../../../../components/legal/shida-versioned-legal-page";
import { getShidaLegalMetadata, shidaLegalPageMetadata } from "../../../../lib/shida-legal";

export function generateStaticParams() { return [{ version: "1.0" }]; }
export async function generateMetadata({ params }: { params: Promise<{ version: string }> }) { const document = getShidaLegalMetadata("privacy", "en", (await params).version); return document ? shidaLegalPageMetadata(document, true) : {}; }
export default async function Page({ params }: { params: Promise<{ version: string }> }) { return <ShidaVersionedLegalPage kind="privacy" locale="en" version={(await params).version} historical/>; }
