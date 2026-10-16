import {notFound} from "next/navigation";
import {PersonalBillNotices} from "@/app/components/shida/personal-bill-notices";
export const dynamic="force-dynamic";
export const metadata={robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!["en","fr","ln","sw"].includes(lang))notFound();return <PersonalBillNotices locale={lang as "fr"|"en"|"ln"|"sw"}/>;}
