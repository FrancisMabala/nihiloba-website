import { clearCommerceCart, CommerceApiError, getCommerceCart } from "../../../services/shida/commerce-client";
import { assertSameOrigin, cartToken, clearCartToken, commerceError, privateJson } from "./route-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await cartToken();
  if (!token) return privateJson({ cart: null });
  try { return privateJson({ cart: await getCommerceCart(token) }); }
  catch (error) {
    if (error instanceof CommerceApiError && error.status === 404) { await clearCartToken(); return privateJson({ cart: null, reason: "invalid_cart" }); }
    return commerceError(error);
  }
}

export async function DELETE(request: Request) {
  const rejected = assertSameOrigin(request); if (rejected) return rejected;
  const token = await cartToken();
  if (!token) return privateJson({ cart: null });
  const version = Number(new URL(request.url).searchParams.get("version"));
  try { return privateJson({ cart: await clearCommerceCart(token, Number.isInteger(version) && version > 0 ? version : undefined) }); }
  catch (error) {
    if (error instanceof CommerceApiError && error.status === 404) await clearCartToken();
    return commerceError(error);
  }
}
