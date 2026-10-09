import { notFound } from "next/navigation";
import { RestaurantCheckoutPage } from "@/app/components/shida/restaurant-checkout-page";
import type { RestaurantLocale } from "@/app/services/shida/restaurants-client";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; restaurant: string }>; searchParams: Promise<{page?:string}> }) {
  const { lang, restaurant } = await params;
  if (!["fr","ln","sw"].includes(lang)) notFound();
  const { page } = await searchParams;
  return RestaurantCheckoutPage({ locale: lang as RestaurantLocale, id: restaurant, page: page && /^[1-9]\d{0,3}$/.test(page) ? page : "1" });
}
