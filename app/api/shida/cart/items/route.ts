import { addCommerceCartItem, CommerceApiError, createCommerceCart } from "../../../../services/shida/commerce-client";
import { assertSameOrigin, cartToken, clearCartToken, commerceError, privateJson, requestObject, setCartToken, validReference } from "../route-utils";

export async function POST(request: Request) {
  const rejected = assertSameOrigin(request); if (rejected) return rejected;
  const body = await requestObject(request);
  const product = body?.product_reference;
  const variant = body?.variant_reference;
  const quantity = body?.quantity ?? 1;
  const version = body?.expected_version;
  if (!validReference(product) || (variant != null && !validReference(variant)) || !Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 100 || (version != null && (!Number.isInteger(version) || Number(version) < 1))) return privateJson({ error: { code: "invalid_request" } }, 400);

  let token = await cartToken();
  if (token) {
    try { return privateJson({ cart: await addCommerceCartItem(token, product, variant as string | null, Number(quantity), version == null ? undefined : Number(version)) }); }
    catch (error) {
      if (!(error instanceof CommerceApiError) || error.status !== 404) return commerceError(error);
      await clearCartToken();
      token = null;
    }
  }
  try {
    const created = await createCommerceCart();
    await setCartToken(created.token);
    return privateJson({ cart: await addCommerceCartItem(created.token, product, variant as string | null, Number(quantity), created.cart.version) });
  } catch (error) { return commerceError(error); }
}
