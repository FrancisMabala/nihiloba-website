import { notFound } from "next/navigation";
import { RestaurantCustomerOrders } from "@/app/components/shida/restaurant-customer-orders";
export const dynamic="force-dynamic";
export const metadata={title:"Food order | SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params}:{params:Promise<{orderRef:string}>}){const {orderRef}=await params;if(!/^[A-Za-z0-9_-]{1,64}$/.test(orderRef))notFound();return <RestaurantCustomerOrders locale="en" orderRef={orderRef}/>;}
