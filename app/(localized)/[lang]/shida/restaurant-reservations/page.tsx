import { notFound } from 'next/navigation';
import { RestaurantCustomerReservations } from '@/app/components/shida/restaurant-customer-reservations';
import { reservationPageData } from '@/app/services/shida/restaurant-reservations';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
export const dynamic='force-dynamic';
export const metadata={title:'Restaurant reservations | SHIDA',robots:{index:false,follow:false,noarchive:true}};
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<{establishment?:string}>}){
  const [{lang},query]=await Promise.all([params,searchParams]);
  if(!['fr','ln','sw'].includes(lang))notFound();
  return <RestaurantCustomerReservations locale={lang as RestaurantLocale} {...await reservationPageData(lang as RestaurantLocale,query.establishment)}/>;
}
