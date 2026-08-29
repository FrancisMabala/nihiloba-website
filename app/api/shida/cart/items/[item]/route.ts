import { CommerceApiError, removeCommerceCartItem, updateCommerceCartItem } from "../../../../../services/shida/commerce-client";
import { assertSameOrigin, cartToken, clearCartToken, commerceError, privateJson, requestObject, validReference } from "../../route-utils";

type Context = { params: Promise<{ item: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const rejected = assertSameOrigin(request); if (rejected) return rejected;
  const { item } = await params; const body = await requestObject(request); const quantity = body?.quantity; const version = body?.expected_version;
  if (!validReference(item) || !Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 100 || (version != null && (!Number.isInteger(version) || Number(version) < 1))) return privateJson({ error: { code: "invalid_request" } }, 400);
  const token = await cartToken(); if (!token) return privateJson({ error: { code: "cart_not_found" } }, 404);
  try { return privateJson({ cart: await updateCommerceCartItem(token, item, Number(quantity), version == null ? undefined : Number(version)) }); }
  catch (error) { if (error instanceof CommerceApiError && error.status === 404) await clearCartToken(); return commerceError(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  const rejected = assertSameOrigin(request); if (rejected) return rejected;
  const { item } = await params; if (!validReference(item)) return privateJson({ error: { code: "invalid_request" } }, 400);
  const token = await cartToken(); if (!token) return privateJson({ error: { code: "cart_not_found" } }, 404);
  const version = Number(new URL(request.url).searchParams.get("version"));
  try { return privateJson({ cart: await removeCommerceCartItem(token, item, Number.isInteger(version) && version > 0 ? version : undefined) }); }
  catch (error) { if (error instanceof CommerceApiError && error.status === 404) await clearCartToken(); return commerceError(error); }
}
