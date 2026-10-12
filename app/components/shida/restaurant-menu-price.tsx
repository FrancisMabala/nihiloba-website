import { basicText } from "../../lib/restaurant-basic-copy";
import { restaurantCopy } from "../../lib/restaurant-i18n";
import { restaurantAmount } from "../../lib/restaurant-photo-public";
import type { RestaurantLocale, RestaurantMenuItem } from "../../services/shida/restaurants-client";

const portionStep = { en: 'In steps of', fr: 'Par paliers de', ln: 'Bakisa na biteni ya', sw: 'Kwa hatua za' };

export function RestaurantPrice({ item, locale }: { item: RestaurantMenuItem; locale: RestaurantLocale }) {
  const t = restaurantCopy[locale];
  if (item.pricing_model === "UNIT_PRICED" && item.unit_price !== null && item.currency) return <p><strong>{restaurantAmount(item.unit_price, locale)} {item.currency}</strong>{item.sale_unit_label && <> / {item.sale_unit_label}</>}</p>;
  if (item.pricing_model === "AMOUNT_PRICED" && item.amount_mode === "flexible" && item.minimum_amount !== null && item.currency) return <div><p>{basicText(locale,"flexibleFrom")}: {restaurantAmount(item.minimum_amount, locale)} {item.currency}</p>{item.amount_step && <p>{portionStep[locale]} {restaurantAmount(item.amount_step, locale)} {item.currency}</p>}</div>;
  if (item.pricing_model === "AMOUNT_PRICED" && item.currency && (item.allowed_amounts.length || item.minimum_amount !== null)) return <div><p><strong>{t.amounts}</strong>{item.sale_unit_label && <> · {item.sale_unit_label}</>}</p>{item.allowed_amounts.length > 0 && <p>{item.allowed_amounts.map((amount) => `${restaurantAmount(amount, locale)} ${item.currency}`).join(" · ")}</p>}{item.minimum_amount !== null && <p>{t.minimum}: {restaurantAmount(item.minimum_amount, locale)} {item.currency}</p>}</div>;
  return <p>{t.unknownPrice}</p>;
}
