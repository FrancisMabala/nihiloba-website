import { RestaurantDetailPage, restaurantDetailMetadata } from "@/app/components/shida/restaurants";
import type { RestaurantSearch } from "@/app/services/shida/restaurants-client";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ restaurant: string }>; searchParams: Promise<RestaurantSearch> };
export async function generateMetadata({ params }: Props) {
 const p = await params;
 
 return restaurantDetailMetadata("en", p.restaurant, true);
}
export default async function Page({ params, searchParams }: Props) {
 const p = await params;
 
 return RestaurantDetailPage({ locale: "en", search: await searchParams, id: p.restaurant, menuOnly: true });
}
