"use client";
import { restaurantCopy, restaurantLocales, restaurantPath } from "../../lib/restaurant-i18n";
import { restaurantLanguageNames } from "../../lib/restaurant-detail-copy";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";
export function DiscoveryLanguage({ locale, search }: { locale: RestaurantLocale; search: string }) {
 // A fresh document deliberately revalidates public eligibility, matching all Restaurant navigation.
 // eslint-disable-next-line @next/next/no-location-assign-relative-destination
 return <label className="rd-language"><span className="sr-only">{restaurantCopy[locale].language}</span><select value={locale} onChange={e => { window.location.assign(`${restaurantPath(e.target.value as RestaurantLocale)}${search ? `?${search}` : ""}`); }}>{restaurantLocales.map(lang => <option key={lang} value={lang}>{restaurantLanguageNames[lang]}</option>)}</select></label>;
}
