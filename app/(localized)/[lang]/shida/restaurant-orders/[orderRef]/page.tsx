import { notFound } from "next/navigation";
import { RestaurantCustomerOrders } from "@/app/components/shida/restaurant-customer-orders";
import type { RestaurantLocale } from "@/app/services/shida/restaurants-client";
export const dynamic="force-dynamic";
export const metadata={title:"Food order | SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params}:{params:Promise<{lang:string;orderRef:string}>}){const {lang,orderRef}=await params;if(!["fr","ln","sw"].includes(lang)||!/^[A-Za-z0-9_-]{1,64}$/.test(orderRef))notFound();return <RestaurantCustomerOrders locale={lang as RestaurantLocale} orderRef={orderRef}/>;}
