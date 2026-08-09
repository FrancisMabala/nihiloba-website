export type PublicCollection<T> = {
  items: T[];
  count: number;
};

export type PublicImage = {
  url: string;
  alt: string | null;
};

export type ApartmentListing = {
  public_ref: string;
  slug: string;
  title: string;
  city: string | null;
  area: string | null;
  commune: string | null;
  quartier: string | null;
  rent: number | null;
  currency: string | null;
  number_of_rooms: number | null;
  description: string | null;
  availability_state: string | null;
  images: PublicImage[];
  public_detail_url: string;
  visit_url: string | null;
};

export type HotelRoomType = {
  name: string;
  price: number | null;
  currency: string | null;
  capacity: number | null;
  total_rooms: number | null;
  image_reference: string | null;
  description: string | null;
};

export type HotelListing = {
  public_ref: string;
  slug: string;
  name: string;
  description: string | null;
  country_code: string | null;
  city: string | null;
  area: string | null;
  commune: string | null;
  quartier: string | null;
  address_line: string | null;
  landmark: string | null;
  room_types: HotelRoomType[];
  public_detail_url: string;
  booking_url: string | null;
};
