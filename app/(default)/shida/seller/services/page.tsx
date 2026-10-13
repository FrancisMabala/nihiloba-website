import {PersonalServicesManager} from "@/app/components/shida/personal-services-manager";
export const dynamic="force-dynamic";
export const metadata={title:"My Services · SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default function Page(){return <PersonalServicesManager locale="en"/>;}
