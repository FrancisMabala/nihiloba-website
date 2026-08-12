import { ServiceProviderPage, serviceProviderMetadata } from "../../../../../components/shida/services";
export async function generateMetadata({params}:{params:Promise<{provider:string}>}){return serviceProviderMetadata("en",(await params).provider);}
export default async function Page({params}:{params:Promise<{provider:string}>}){return <ServiceProviderPage locale="en" slug={(await params).provider}/>;}
