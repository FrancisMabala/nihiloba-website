import {AccountSpace} from "@/app/components/shida/account-space";
export const metadata={title:"My SHIDA space",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{view?:string;section?:string;role?:string;kind?:string;offer?:string}>}){return <AccountSpace locale="en" initialView={(await searchParams).view} initialSection={(await searchParams).section} applyOffer={(await searchParams).kind==='apply'?(await searchParams).offer:undefined} transactionRole={(await searchParams).role}/>;}
