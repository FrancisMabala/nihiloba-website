import {PersonalServicesManager} from "@/app/components/shida/personal-services-manager";
import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
type Locale="fr"|"en"|"ln"|"sw";
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<{offering?:string|string[]}>}){
 const {lang}=await params;if(!["fr","en","ln","sw"].includes(lang))notFound();
 const {offering}=await searchParams;
 return <PersonalServicesManager locale={lang as Locale} offeringRef={typeof offering==="string"?offering:null}/>;
}
