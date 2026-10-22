import {WenzeSeller} from "@/app/components/shida/wenze-seller";
export const dynamic="force-dynamic";
export const metadata={title:"Wenze · Quick Sell",robots:{index:false,follow:false,noarchive:true}};
import {notFound} from "next/navigation";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!["en","fr","ln","sw"].includes(lang))notFound();return <WenzeSeller quickSell locale={lang as WenzeLocale}/>;}
