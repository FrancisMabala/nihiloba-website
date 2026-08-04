import { ShidaPage } from "../../components/pages/localized-pages";
import { pageMetadata } from "../../lib/i18n";

export const metadata = pageMetadata("en", "shida", "/shida");

export default function Page() {
  return <ShidaPage locale="en" />;
}
