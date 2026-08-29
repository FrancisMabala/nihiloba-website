import type { PublicImage } from "./shida-public";

export type CommerceMoney = {
  amount: string;
  currency: string | null;
};

export type CommerceCartItem = {
  reference: string;
  product_reference: string;
  name: string;
  variant: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
  currency: string;
  image: PublicImage | null;
  product_url: string | null;
};

export type CommerceSellerGroup = {
  store_reference: string;
  store_name: string;
  subtotal: string;
  currency: string | null;
  fulfillment_method: "pickup" | "delivery" | null;
  delivery_fee: string | null;
  delivery_fee_status: string | null;
  items: CommerceCartItem[];
};

export type CommerceCart = {
  reference: string;
  status: "active" | "checkout_started";
  currency: string | null;
  version: number;
  item_count: number;
  seller_count: number;
  product_subtotal: string;
  delivery_total: string | null;
  grand_total: string | null;
  seller_groups: CommerceSellerGroup[];
  expires_at: string;
};

export type CommerceConflictCode =
  | "empty_cart"
  | "fulfillment_required"
  | "insufficient_stock"
  | "mixed_currency"
  | "negotiation_required"
  | "price_changed"
  | "unavailable"
  | "invalid_variant"
  | "unsupported_currency"
  | string;

export type CommerceCartConflict = {
  code: CommerceConflictCode;
  item_reference: string | null;
  current_value: string | number | null;
};

export type CommerceCartValidation = {
  valid: boolean;
  cart: CommerceCart;
  conflicts: CommerceCartConflict[];
};

export type CommerceHandoff = {
  handoff_reference: string;
  expires_at: string;
  whatsapp_url: string;
};

export type CommerceErrorCode =
  | "api_unavailable"
  | "cart_not_found"
  | "cart_conflict"
  | "forbidden"
  | "invalid_request"
  | "malformed_response"
  | "stale_cart_version"
  | "validation_error"
  | string;

export type CommerceErrorPayload = {
  error: {
    code: CommerceErrorCode;
    conflicts?: CommerceCartConflict[];
  };
};
