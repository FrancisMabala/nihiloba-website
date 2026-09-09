import { RestaurantBusinessPage, restaurantMetadata } from "@/app/components/shida/restaurants";
import type { RestaurantSearch } from "@/app/services/shida/restaurants-client";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ business: string }>; searchParams: Promise<RestaurantSearch> };
export async function generateMetadata({ params }: Props) {
 const p = await params;
 
 return restaurantMetadata("en", "", p.business);
}
export default async function Page({ params, searchParams }: Props) {
 const p = await params;
 
 return RestaurantBusinessPage({ locale: "en", search: await searchParams, id: p.business });
}
