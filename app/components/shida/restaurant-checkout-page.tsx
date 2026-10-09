import { notFound } from "next/navigation";
import { getRestaurant, getRestaurantMenu, getRestaurantWebOptions, type RestaurantLocale } from "../../services/shida/restaurants-client";
import { RestaurantCheckout } from "./restaurant-checkout";

export async function RestaurantCheckoutPage({ locale, id, page }: { locale: RestaurantLocale; id: string; page: string }) {
  const establishment = await getRestaurant(locale, id).catch(() => null);
  if (!establishment) notFound();
  const options = await getRestaurantWebOptions(establishment.public_ref).catch(() => null);
  if (!options?.available) notFound();
  const menu = await getRestaurantMenu(locale, establishment.public_ref, page).catch(() => null);
  return <RestaurantCheckout locale={locale} establishment={establishment} options={options} menu={menu} />;
}
