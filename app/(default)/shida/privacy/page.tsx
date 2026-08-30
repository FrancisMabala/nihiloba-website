import { ShidaVersionedLegalPage } from "../../../components/legal/shida-versioned-legal-page";
import { getShidaLegalMetadata, shidaLegalPageMetadata } from "../../../lib/shida-legal";

export const metadata = shidaLegalPageMetadata(getShidaLegalMetadata("privacy", "en")!);
export default function Page() { return <ShidaVersionedLegalPage kind="privacy" locale="en"/>; }
