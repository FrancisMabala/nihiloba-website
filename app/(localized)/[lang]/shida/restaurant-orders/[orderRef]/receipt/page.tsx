import { RestaurantCustomerOrders } from '@/app/components/shida/restaurant-customer-orders';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Receipt | SHIDA',robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params}:{params:Promise<{orderRef:string;establishment?:string;lang?:string}>}) {
 const p=await params;
 const locale=p.lang ?? 'en';
 if (!['en','fr','ln','sw'].includes(locale) || !/^[A-Za-z0-9_-]{1,64}$/.test(p.orderRef) || p.establishment && !/^RST_[A-Za-z0-9_-]+$/.test(p.establishment)) notFound();
 return <RestaurantCustomerOrders locale={locale as 'en'|'fr'|'ln'|'sw'} orderRef={p.orderRef} receiptOnly/>;
}
