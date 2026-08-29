import { CommerceApiError, createCommerceHandoff } from "../../../../services/shida/commerce-client";
import { assertSameOrigin, cartToken, clearCartToken, commerceError, privateJson } from "../route-utils";

export async function POST(request: Request) {
  const rejected = assertSameOrigin(request); if (rejected) return rejected;
  const token = await cartToken(); if (!token) return privateJson({ error: { code: "cart_not_found" } }, 404);
  try { return privateJson(await createCommerceHandoff(token), 201); }
  catch (error) { if (error instanceof CommerceApiError && error.status === 404) await clearCartToken(); return commerceError(error); }
}
