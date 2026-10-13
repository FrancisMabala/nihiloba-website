import {notFound} from "next/navigation";
import {PersonalServiceBill} from "@/app/components/shida/personal-service-bill";
export const dynamic="force-dynamic";
export const metadata={title:"Service bill · SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params}:{params:Promise<{reservation:string}>}){const {reservation}=await params;if(!/^RSV_[A-Za-z0-9_-]+$/.test(reservation))notFound();return <PersonalServiceBill locale="en" reservationRef={reservation}/>;}
