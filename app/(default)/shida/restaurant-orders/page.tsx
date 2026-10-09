import { RestaurantCustomerOrders } from "@/app/components/shida/restaurant-customer-orders";
export const dynamic="force-dynamic";
export const metadata={title:"My food orders | SHIDA",robots:{index:false,follow:false,noarchive:true}};
export default function Page(){return <RestaurantCustomerOrders locale="en"/>;}
