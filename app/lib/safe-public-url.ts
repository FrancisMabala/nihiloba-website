const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_PREFIX = "/dbrxpvmzp/image/upload/";
const PUBLIC_GO_PATH = /^\/go\/[A-Za-z0-9_-]+\/?$/;
const WHATSAPP_PATH = /^\/[A-Za-z0-9_-]+\/?$/;
const WEBSITE_ORIGIN = "https://nihiloba.com";

export function safeWenzeBusinessContact(value: string | null | undefined): string | null {
  return value && /^https:\/\/wa\.me\/[1-9][0-9]{7,14}(?:\?text=[A-Za-z0-9_-]{1,80})?$/.test(value) ? value : null;
}

export function safePublicActionUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;

    const allowed = url.hostname === "wa.me"
      ? WHATSAPP_PATH.test(url.pathname) && [...url.searchParams.keys()].every((key) => key === "text")
      : (url.hostname === "api.nihiloba.com" || url.hostname === "nihiloba.com") &&
        PUBLIC_GO_PATH.test(url.pathname) && !url.search;
    return allowed ? value : null;
  } catch {
    return null;
  }
}

export function safePublicImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if(url.origin === 'https://api.nihiloba.com' && !url.username && !url.password && !url.search && !url.hash && /^\/api\/apartments\/photos\/APF_[a-f0-9]{32}$/.test(url.pathname)) return value;
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash &&
      url.hostname === CLOUDINARY_HOST &&
      url.pathname.startsWith(CLOUDINARY_PREFIX)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function safePublicExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? value : null;
  } catch {
    return null;
  }
}

export function safePublicWebsiteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, WEBSITE_ORIGIN);
    const isMarketplacePath = url.pathname.startsWith("/shida/") || url.pathname.startsWith("/fr/shida/");
    if (url.origin !== WEBSITE_ORIGIN || url.username || url.password || url.port || url.search || url.hash || !isMarketplacePath) return null;
    return value;
  } catch {
    return null;
  }
}
