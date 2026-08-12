import { ServiceDetailPage, serviceMetadata } from "../../../../../components/shida/services";
import { isLocale } from "../../../../../lib/i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string;service:string}>}){const {lang,service}=await params;return serviceMetadata(isLocale(lang)?lang:"en",service);}
export default async function Page({params,searchParams}:{params:Promise<{lang:string;service:string}>;searchParams:Promise<{from?:string|string[];option?:string|string[]}>}){const {lang,service}=await params,search=await searchParams,raw=search.from,option=search.option;return <ServiceDetailPage locale={isLocale(lang)?lang:"en"} slug={service} from={Array.isArray(raw)?raw[0]:raw} option={Array.isArray(option)?option[0]:option}/>;}
