import {WenzeSeller} from "@/app/components/shida/wenze-seller";
export const dynamic="force-dynamic";
export const metadata={title:"Wenze · Quick Sell",robots:{index:false,follow:false,noarchive:true}};
export default function Page(){return <WenzeSeller quickSell locale="en"/>;}
