import {PersonalServicesManager} from "@/app/components/shida/personal-services-manager";
export const dynamic="force-dynamic";
export const metadata={title:"My Services · SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default async function Page({searchParams}:{searchParams:Promise<{offering?:string|string[]}>}){const {offering}=await searchParams;return <PersonalServicesManager locale="en" offeringRef={typeof offering==="string"?offering:null}/>;}
