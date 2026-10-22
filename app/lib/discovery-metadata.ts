import type { Metadata } from "next";
import { discoveryCopy, discoveryLocales, discoveryPath, type DiscoveryLocale } from "./discovery-copy";
export function discoveryMetadata(locale: DiscoveryLocale): Metadata {
  const t = discoveryCopy[locale], path = discoveryPath(locale, "/shida");
  return { title: "SHIDA — " + t.title, description: t.intro, alternates: { canonical: path, languages: { ...Object.fromEntries(discoveryLocales.map(l => [l, discoveryPath(l, "/shida")])), "x-default": "/shida" } }, openGraph: { title: t.title, description: t.intro, url: path } };
}
