'use client';
import Image from 'next/image';
import { useState } from 'react';
import { isRestaurantPhoto, restaurantPhotoUrl } from '../../lib/restaurant-photo-public';

export function RestaurantPhoto({ src, alt, establishment = false, sizes = '(max-width: 767px) calc(100vw - 48px), (max-width: 1100px) 45vw, 380px' }: { src?: string | null; alt: string; establishment?: boolean; sizes?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const safe = restaurantPhotoUrl(src);
  if (!safe || failed === safe) return establishment ? <span className="restaurant-photo-illustration" aria-hidden="true"/> : null;
  return <Image src={safe} alt={alt} fill sizes={sizes} unoptimized={isRestaurantPhoto(safe)} loading="lazy" decoding="async" onError={() => setFailed(safe)}/>;
}
