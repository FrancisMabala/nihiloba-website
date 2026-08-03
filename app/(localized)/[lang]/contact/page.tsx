import { ContactPage } from "../../../components/pages/localized-pages";
import { isLocale, pageMetadata } from "../../../lib/i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return isLocale(lang)?pageMetadata(lang,"contact","/contact"):{}; }
export default async function Page({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return <ContactPage locale={isLocale(lang)?lang:"en"}/>; }
