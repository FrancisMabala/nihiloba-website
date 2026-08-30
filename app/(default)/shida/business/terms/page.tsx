import { ShidaVersionedLegalPage } from "../../../../components/legal/shida-versioned-legal-page";
import { getShidaLegalMetadata, shidaLegalPageMetadata } from "../../../../lib/shida-legal";

export const metadata = shidaLegalPageMetadata(getShidaLegalMetadata("business-terms", "en")!);
export default function Page() { return <ShidaVersionedLegalPage kind="business-terms" locale="en"/>; }
