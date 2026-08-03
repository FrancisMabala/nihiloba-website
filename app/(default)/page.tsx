import { HomePage } from "../components/pages/localized-pages";
import { pageMetadata } from "../lib/i18n";

export const metadata = pageMetadata("en", "home");
export default function Page() { return <HomePage locale="en" />; }
