import { safePublicImageUrl } from './safe-public-url';

// Backend-owned media is revocable. Do not pass it through Next's image cache.
export function isRestaurantPhoto(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === 'https://api.nihiloba.com' && !url.username && !url.password && !url.search && !url.hash && /^\/api\/restaurants\/photos\/[A-Za-z0-9_-]{1,80}$/.test(url.pathname);
  } catch { return false; }
}
export function restaurantPhotoUrl(value: string | null | undefined): string | null {
  return value && isRestaurantPhoto(value) ? value : safePublicImageUrl(value);
}

// Preserve decimal precision, including amounts larger than Number.MAX_SAFE_INTEGER.
export function restaurantAmount(value: string, locale: string): string {
  const [whole, fraction] = value.split('.');
  const decimal = fraction?.replace(/0+$/, '');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + (decimal ? `${locale === 'fr' ? ',' : '.'}${decimal}` : '');
}
