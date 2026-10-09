import { getRestaurantMenu, type RestaurantLocale } from "../../../../services/shida/restaurants-client";
import { guestReference } from "../../../../lib/restaurant-guest-contract";
import { ShidaApiError } from "../../../../services/shida/public-client";
export async function GET(request:Request,context:{params:Promise<{establishment:string}>}) {
  const {establishment} = await context.params, q = new URL(request.url).searchParams;
  const language = q.get("language") ?? "fr", page = q.get("page") ?? "1";
  const headers = {"Cache-Control":"no-store"};
  if (!guestReference(establishment) || !["en","fr","ln","sw"].includes(language) || !/^[1-9]\d{0,3}$/.test(page) || [...q.keys()].some(k=>!["language","page"].includes(k) || q.getAll(k).length !== 1)) return Response.json({detail:"restaurant_unavailable"},{status:422,headers});
  try { return Response.json(await getRestaurantMenu(language as RestaurantLocale,establishment,page),{headers}); }
  catch(e) { return Response.json({detail:"restaurant_unavailable"},{status:e instanceof ShidaApiError && e.kind === "not-found" ? 404 : 503,headers}); }
}
