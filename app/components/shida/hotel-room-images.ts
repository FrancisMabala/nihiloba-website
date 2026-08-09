import { safePublicImageUrl } from "../../lib/safe-public-url";
import type { HotelRoomType, PublicImage } from "../../types/shida-public";

export function resolveHotelRoomImages(room: HotelRoomType, hotelName: string): PublicImage[] {
  const safeUrls = room.image_references.flatMap((reference) => {
    const url = safePublicImageUrl(reference);
    return url ? [url] : [];
  });
  return [...new Set(safeUrls)].map((url, index) => ({
    url,
    alt: `${room.name} - ${hotelName} - photo ${index + 1}`,
  }));
}

export function firstHotelRoomImage(roomTypes: HotelRoomType[], hotelName: string): string | null {
  for (const room of roomTypes) {
    const first = resolveHotelRoomImages(room, hotelName)[0];
    if (first) return first.url;
  }
  return null;
}
