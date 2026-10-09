import { RestaurantCheckoutPage } from "@/app/components/shida/restaurant-checkout-page";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ restaurant: string }>; searchParams: Promise<{page?:string}> }) {
  const { restaurant } = await params;
  const { page } = await searchParams;
  return RestaurantCheckoutPage({ locale: "en", id: restaurant, page: page && /^[1-9]\d{0,3}$/.test(page) ? page : "1" });
}
