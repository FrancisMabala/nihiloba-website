import {marketName} from "../../lib/public-markets";
import {IllustratedMarketplaceHero} from './illustrated-marketplace-hero';
import {RESTAURANTS_SLOGAN} from '../../lib/brand';
import {restaurantDiscoveryFinalCopy} from '../../lib/restaurant-discovery-final-copy';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';

/** Decorative vector only; never a photograph or a real menu listing. */
export function CongoleseMealIllustration(){return <svg className="rd-meal-art" viewBox="0 0 320 180" fill="none" aria-hidden="true">
 <ellipse cx="178" cy="98" rx="126" ry="77" fill="#f8e1bb"/><path d="M268 67q-9-49 24-55 5 41-24 55M283 84q8-43 33-39-3 35-33 39" fill="#8eaa72"/>
 <ellipse cx="173" cy="128" rx="128" ry="39" fill="#9d6939"/><ellipse cx="173" cy="119" rx="127" ry="40" fill="#eec98e" stroke="#815a35" strokeWidth="2"/>
 <path d="M82 104c-1-53 21-74 51-70 32-4 60 33 54 68-29 19-73 22-105 2Z" fill="#fff0ce" stroke="#d9bd90" strokeWidth="2"/><path d="M100 91q8-41 34-45m-11 52q14-41 28-39m-9 43q15-27 20-28" stroke="#e5cda7" strokeWidth="3" strokeLinecap="round"/>
 <path d="M63 120q-12-20 11-25 1-22 24-12 18-17 31 5 22-4 26 19 19 15-3 29-53 19-89-16" fill="#496536"/><path d="m77 109 18 12 15-25m-11 32 24-14m-40-19 3 18m36 10 14 6" stroke="#91a456" strokeWidth="4" strokeLinecap="round"/>
 <path d="m153 127 33-23q31-46 80-29l20-12-3 25q-30 57-92 49l-33 14 7-19Z" fill="#be7438" stroke="#684c31" strokeWidth="2"/><path d="m186 115 14 12m-4-24 16 15m-4-26 17 16m-3-25 17 14" stroke="#6f492c" strokeWidth="5" strokeLinecap="round"/><circle cx="261" cy="85" r="4" fill="#263f32"/><path d="m265 98 9-4" stroke="#684c31" strokeWidth="2"/>
 <path d="m41 37-8-13m24 5-2-15m-28 35-14-5" stroke="#91551f" strokeWidth="3" strokeLinecap="round"/>
 </svg>}
export function RestaurantDiscoveryHero({locale}:{locale:RestaurantLocale}){return <IllustratedMarketplaceHero title={marketName(locale,"restaurants")} slogan={RESTAURANTS_SLOGAN} intro={restaurantDiscoveryFinalCopy[locale].intro} tone="food" art={<CongoleseMealIllustration/>}/>}
