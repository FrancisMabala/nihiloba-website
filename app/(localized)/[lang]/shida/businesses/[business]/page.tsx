import { RestaurantBusinessPage, restaurantMetadata } from "@/app/components/shida/restaurants";
import type { RestaurantSearch } from "@/app/services/shida/restaurants-client";
import { isRestaurantLocale } from "@/app/lib/restaurant-i18n";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; business: string }>; searchParams: Promise<RestaurantSearch> };
export async function generateMetadata({ params }: Props) {
 const p = await params;
 if (!isRestaurantLocale(p.lang)) notFound();
 return restaurantMetadata(p.lang, "", p.business);
}
export default async function Page({ params, searchParams }: Props) {
 const p = await params;
 if (!isRestaurantLocale(p.lang)) notFound();
 return RestaurantBusinessPage({ locale: p.lang, search: await searchParams, id: p.business });
}
