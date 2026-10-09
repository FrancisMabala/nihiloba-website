import { notFound } from "next/navigation";
import { RestaurantCustomerOrders } from "@/app/components/shida/restaurant-customer-orders";
import type { RestaurantLocale } from "@/app/services/shida/restaurants-client";
export const dynamic="force-dynamic";
export const metadata={title:"Food orders | SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!["fr","ln","sw"].includes(lang))notFound();return <RestaurantCustomerOrders locale={lang as RestaurantLocale}/>;}
