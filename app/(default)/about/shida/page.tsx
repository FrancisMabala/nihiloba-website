import { ShidaStoryPage } from "../../../components/pages/shida-story-page";
import { pageMetadata } from "../../../lib/i18n";
export const metadata = { ...pageMetadata("en", "shida", "/shida"), title: "The story of SHIDA", alternates: { canonical: "/about/shida", languages: { en: "/about/shida", fr: "/fr/about/shida" } }, openGraph: { title: "The story of SHIDA", url: "/about/shida" } };
export default function Page() { return <ShidaStoryPage locale="en"/>; }
