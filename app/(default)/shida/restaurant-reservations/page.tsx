import { RestaurantCustomerReservations } from '@/app/components/shida/restaurant-customer-reservations';
import { reservationPageData } from '@/app/services/shida/restaurant-reservations';
export const dynamic='force-dynamic';
export const metadata={title:'My restaurant reservations | SHIDA',robots:{index:false,follow:false,noarchive:true}};
export default async function Page({searchParams}:{searchParams:Promise<{establishment?:string}>}){
  const query=await searchParams;
  return <RestaurantCustomerReservations locale='en' {...await reservationPageData('en',query.establishment)}/>;
}
