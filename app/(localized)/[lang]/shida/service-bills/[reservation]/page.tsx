import {notFound} from "next/navigation";
import {PersonalServiceBill} from "@/app/components/shida/personal-service-bill";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{lang:string;reservation:string}>}){const {lang,reservation}=await params;if(!["fr","en","ln","sw"].includes(lang)||!/^RSV_[A-Za-z0-9_-]+$/.test(reservation))notFound();return <PersonalServiceBill locale={lang as "fr"|"en"|"ln"|"sw"} reservationRef={reservation}/>;}
