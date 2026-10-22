import {AccountSpace} from "@/app/components/shida/account-space";
export const metadata={title:"My SHIDA space",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){return <AccountSpace locale="en" initialView={(await searchParams).view}/>;}
