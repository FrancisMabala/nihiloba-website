import { ServiceProviderPage, serviceProviderMetadata } from "../../../../../../components/shida/services";
import { isServiceLocale } from "../../../../../../lib/services-i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string;provider:string}>}){const {lang,provider}=await params;return serviceProviderMetadata(isServiceLocale(lang)?lang:"en",provider);}
export default async function Page({params}:{params:Promise<{lang:string;provider:string}>}){const {lang,provider}=await params;return <ServiceProviderPage locale={isServiceLocale(lang)?lang:"en"} slug={provider}/>;}
