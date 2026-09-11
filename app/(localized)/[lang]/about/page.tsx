import { AboutPage } from "../../../components/pages/about-page";
import { isLocale, pageMetadata } from "../../../lib/i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return isLocale(lang)?pageMetadata(lang,"about","/about"):{}; }
export default async function Page({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return <AboutPage locale={isLocale(lang)?lang:"en"}/>; }
