import { ServiceProviderPage, serviceProviderMetadata } from "../../../../../../components/shida/services";
import { isLocale } from "../../../../../../lib/i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string;provider:string}>}){const {lang,provider}=await params;return serviceProviderMetadata(isLocale(lang)?lang:"en",provider);}
export default async function Page({params}:{params:Promise<{lang:string;provider:string}>}){const {lang,provider}=await params;return <ServiceProviderPage locale={isLocale(lang)?lang:"en"} slug={provider}/>;}
