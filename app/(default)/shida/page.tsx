import { ShidaPage } from "../../components/pages/localized-pages";
import { discoveryMetadata } from "../../lib/discovery-metadata";

export const metadata = discoveryMetadata("en");
export const revalidate = 60;

export default function Page() {
  return <ShidaPage locale="en" />;
}
