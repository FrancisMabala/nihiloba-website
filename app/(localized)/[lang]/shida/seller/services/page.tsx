import {PersonalServicesManager} from "@/app/components/shida/personal-services-manager";
import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
type Locale="fr"|"en"|"ln"|"sw";
export default async function Page({params}:{params:Promise<{lang:string}>}){
 const {lang}=await params;if(!["fr","en","ln","sw"].includes(lang))notFound();
 return <PersonalServicesManager locale={lang as Locale}/>;
}
