import {discoveryCopy} from "./discovery-copy";
import type {ServiceLocale} from "./services-i18n";

const positions = {emplois:0,services:1,wenze:2,appartements:3,hotels:4,restaurants:5,transport:6} as const;
export type PublicMarket = keyof typeof positions;
export function marketName(locale:ServiceLocale, market:PublicMarket) {
  return discoveryCopy[locale].labels[positions[market]];
}
