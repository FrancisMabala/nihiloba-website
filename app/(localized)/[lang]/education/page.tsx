import { EducationPage } from "../../../components/pages/localized-pages";
import { isLocale, pageMetadata } from "../../../lib/i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return isLocale(lang)?pageMetadata(lang,"education","/education"):{}; }
export default async function Page({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return <EducationPage locale={isLocale(lang)?lang:"en"}/>; }
