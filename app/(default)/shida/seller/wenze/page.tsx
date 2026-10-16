import {WenzeSeller} from "@/app/components/shida/wenze-seller";
export const dynamic="force-dynamic";
export const metadata={title:"Wenze · Personal seller",robots:{index:false,follow:false,noarchive:true}};
export default function Page(){return <WenzeSeller locale="en"/>;}
