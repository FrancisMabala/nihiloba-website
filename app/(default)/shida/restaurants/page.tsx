import { RestaurantListPage, restaurantMetadata } from "@/app/components/shida/restaurants";
import type { RestaurantSearch } from "@/app/services/shida/restaurants-client";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<RestaurantSearch> };
export function generateMetadata() {
 return restaurantMetadata("en", "");
}
export default async function Page({ searchParams }: Props) {
 return RestaurantListPage({ locale: "en", search: await searchParams });
}
