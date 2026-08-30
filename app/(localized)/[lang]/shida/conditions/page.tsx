import { notFound } from "next/navigation";
import { ShidaVersionedLegalPage } from "../../../../components/legal/shida-versioned-legal-page";
import { getShidaLegalMetadata, shidaLegalPageMetadata } from "../../../../lib/shida-legal";

export const metadata = shidaLegalPageMetadata(getShidaLegalMetadata("terms", "fr")!);
export default async function Page({ params }: { params: Promise<{ lang: string }> }) { if ((await params).lang !== "fr") notFound(); return <ShidaVersionedLegalPage kind="terms" locale="fr"/>; }
