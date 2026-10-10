import { personalRequestOrigin } from "../../../../lib/personal-request-origin";
import { sellerErrorCodes } from "../../../../lib/restaurant-seller-contract";
import { GUEST_BACKEND, GUEST_COOKIE, GUEST_PROXY, guestBody, guestReference, guestRoute } from "../../../../lib/restaurant-guest-contract";

export const dynamic = "force-dynamic";
const PRIVATE = { "Cache-Control": "private, no-store", Vary: "Cookie, Origin" };
const fail = (status: number, detail = "restaurant_unavailable", extra: Record<string,string> = {}) => Response.json({detail},{status,headers:{...PRIVATE,...extra}});
type Context = {params: Promise<{path: string[]}>};
// Accommodate the contract's full 50 lines + 20×20 components, including UTF-8
// keys, while keeping memory bounded. Normal phone baskets are much smaller.
const MAX_BODY_BYTES=256*1024;
async function boundedText(request:Request):Promise<string|null> {
  if(!request.body)return "";
  const reader=request.body.getReader(), chunks:Uint8Array[]=[];let size=0;
  try {
    while(true) {const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY_BYTES){await reader.cancel();return null;}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  } catch {return null;} finally {reader.releaseLock();}
}

// Only the expected exact visit path is rewritten, including expiry/deletion.
export function guestSetCookie(raw: string, establishment: string, visit: string): string | null {
  const path = `${GUEST_BACKEND}/establishments/${establishment}/visits/${visit}`;
  if (!raw.startsWith(`${GUEST_COOKIE}=`) || !/(?:^|;)\s*HttpOnly(?:;|$)/i.test(raw) || !/(?:^|;)\s*Secure(?:;|$)/i.test(raw) || !/(?:^|;)\s*SameSite=Strict(?:;|$)/i.test(raw) || /(?:^|;)\s*Domain=/i.test(raw)) return null;
  const paths = raw.match(/(?:^|;)\s*Path=([^;]*)/gi);
  if (paths?.length !== 1 || paths[0].split("=")[1] !== path) return null;
  return raw.replace(/(;)\s*Path=[^;]*/i, `$1 Path=${GUEST_PROXY}/establishments/${establishment}/visits/${visit}`);
}
async function handle(request: Request, context: Context) {
  const parts = (await context.params).path, path = parts.join("/");
  if (!guestRoute(path,request.method)) return fail(404);
  const url = new URL(request.url);
  // Production must be reached through HTTPS (the TLS terminator owns this header).
  if (url.protocol !== "https:" && request.headers.get("x-forwarded-proto") !== "https") return fail(503);
  const query = url.searchParams;
  if ([...query].some(([k,v]) => !(path.endsWith("/entry") || path.endsWith("/service-proposals") || path.endsWith("/service-payment")) || k !== "language" || !["fr","en","ln","sw"].includes(v)) || query.getAll("language").length > 1) return fail(422);
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const origin = personalRequestOrigin(request);
  if (request.method !== "GET" && !origin) return fail(403);
  let body: string | undefined;
  const noBody = request.method === "GET" || request.method === "DELETE" || path.endsWith("/close");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail(413);
  const rawBody=await boundedText(request);
  if(rawBody===null)return fail(413);
  if (noBody) { if (rawBody.length) return fail(422); }
  else {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail(415);
    body = rawBody;
    try { if (!guestBody(path,JSON.parse(body))) return fail(422); } catch { return fail(422); }
  }
  const visit = parts[2] === "visits" ? parts[3] : undefined;
  const tokens = (request.headers.get("cookie") ?? "").split(";").map(s=>s.trim()).filter(s=>s.startsWith(`${GUEST_COOKIE}=`));
  // Personal/Business cookies and Authorization are deliberately never forwarded.
  if (visit && (tokens.length !== 1 || !/^[A-Za-z0-9_-]{20,256}$/.test(tokens[0].slice(GUEST_COOKIE.length+1)))) return fail(404);
  try {
    const base = new URL(process.env.SHIDA_API_BASE_URL ?? "https://api.nihiloba.com");
    if (base.protocol !== "https:" || base.username || base.password) return fail(503);
    const target = new URL(`${GUEST_BACKEND}/${path}`,base.origin); target.search = query.toString();
    const upstream = await fetch(target,{method:request.method,body,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(12000),headers:{Accept:"application/json",...(body ? {"Content-Type":"application/json"} : {}),...(origin ? {Origin:origin} : {}),...(visit ? {Cookie:tokens[0]} : {})}});
    const value = await upstream.json().catch(()=>null);
    if (value && typeof value === "object" && Object.hasOwn(value,"authority")) return fail(502);
    const headers = new Headers(PRIVATE);
    const retry = upstream.headers.get("retry-after");
    if (retry && (/^\d{1,6}$/.test(retry) || Number.isFinite(Date.parse(retry)))) headers.set("Retry-After",retry);
    const cookieVisit = visit ?? (guestReference(value?.visit_ref) ? value.visit_ref : undefined);
    const cookieHeaders = upstream.headers.getSetCookie();
    if (path.endsWith("/visits") && upstream.ok && cookieHeaders.length !== 1) return fail(502);
    if (cookieHeaders.length) {
      if (!cookieVisit || cookieHeaders.length !== 1) return fail(502);
      const rewritten = guestSetCookie(cookieHeaders[0],parts[1],cookieVisit);
      if (!rewritten) return fail(502);
      headers.append("Set-Cookie",rewritten);
    }
    if (!upstream.ok) {
      const detail = sellerErrorCodes.has(value?.detail) || ["restaurant_guest_closed","restaurant_guest_limit"].includes(value?.detail) ? value.detail : "restaurant_unavailable";
      return Response.json({detail},{status:upstream.status >= 400 && upstream.status <= 599 ? upstream.status : 502,headers});
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail(502);
    return Response.json(value,{headers});
  } catch { return fail(503); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const PUT = () => fail(405);
export const HEAD = PUT;
export const OPTIONS = PUT;
