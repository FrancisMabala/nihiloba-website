import { ServiceDetailPage, serviceMetadata } from "../../../../components/shida/services";
export async function generateMetadata({params}:{params:Promise<{service:string}>}){return serviceMetadata("en",(await params).service);}
export default async function Page({params,searchParams}:{params:Promise<{service:string}>;searchParams:Promise<{from?:string|string[]}>}){const {service}=await params,raw=(await searchParams).from;return <ServiceDetailPage locale="en" slug={service} from={Array.isArray(raw)?raw[0]:raw}/>;}
