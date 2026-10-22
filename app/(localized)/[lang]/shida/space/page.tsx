import {notFound} from "next/navigation";
import {AccountSpace} from "@/app/components/shida/account-space";
import type {MarketplaceLocale} from "@/app/components/shida/marketplace-controls";
export const metadata={title:"SHIDA · Mon espace",robots:{index:false,follow:false}};
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<{view?:string}>}){
 const {lang}=await params;if(!["en","fr","ln","sw"].includes(lang))notFound();
 return <AccountSpace locale={lang as MarketplaceLocale} initialView={(await searchParams).view}/>;
}
