import {PersonalBillNotices} from "@/app/components/shida/personal-bill-notices";
export const dynamic="force-dynamic";
export const metadata={title:"Service bill notices · SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default function Page(){return <PersonalBillNotices locale="en"/>;}
