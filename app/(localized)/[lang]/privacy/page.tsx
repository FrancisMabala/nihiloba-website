import { PrivacyPolicyPage } from "../../../components/pages/privacy-policy-page";
import { isLocale, pageMetadata } from "../../../lib/i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return isLocale(lang)?pageMetadata(lang,"privacy","/privacy"):{}; }
export default async function Page({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return <PrivacyPolicyPage locale={isLocale(lang)?lang:"en"}/>; }
