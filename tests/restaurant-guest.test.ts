import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST, PATCH, DELETE, PUT, HEAD, OPTIONS, guestSetCookie } from "../app/api/shida/restaurant-guests/[...path]/route";
import { GUEST_COOKIE, guestRoute, guestBody } from "../app/lib/restaurant-guest-contract";
import { guestAction, replayGuestAction } from "../app/lib/restaurant-guest-browser";
const base="establishments/RST_one", visit=`${base}/visits/RGV_one`, basket=`${visit}/baskets/RBA_one`;
const secret="x".repeat(43), cookie=`${GUEST_COOKIE}=${secret}`;
const selections={standalone:[{key:"food",item_ref:"RMI_one",quantity:1}],plates:[{key:"plate",components:[{key:"pondu",item_ref:"RMI_pondu",selected_amount:"1000.00"}]}]};
function req(path:string,method="GET",body?:unknown,headers:Record<string,string>={}) {
  return new Request(`https://nihiloba.com/api/shida/restaurant-guests/${path}`,{method,headers:{Origin:"https://nihiloba.com",Cookie:`shida_dashboard_session=personal; business_token=business; ${cookie}`,"Content-Type":"application/json",...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
const ctx=(path:string)=>({params:Promise.resolve({path:path.split("/")})});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe("09B1 narrow private HTTPS proxy",()=>{
  it("allows exactly guest routes and methods",()=>{
    for(const [path,methods] of [[`${base}/entry`,["GET"]],[`${base}/visits`,["POST"]],[visit,["GET","DELETE"]],[`${visit}/close`,["POST"]],[`${visit}/baskets`,["POST"]],[basket,["GET","PATCH"]],[`${basket}/quote`,["POST"]],[`${basket}/submit`,["POST"]],[`${visit}/orders/ROD_one`,["GET"]],[`${visit}/orders/ROD_one/pickup-code`,["GET"]],[`${visit}/orders/ROD_one/cancel`,["POST"]],[`${visit}/orders/ROD_one/request_cancellation`,["POST"]]] as [string,string[]][]) {
      for(const method of ["GET","POST","PATCH","DELETE","PUT","HEAD","OPTIONS"])expect(guestRoute(path,method)).toBe(methods.includes(method));
    }
    for(const path of ["",`${visit}/tables`,`${basket}/submit/delivery`,`${visit}/orders/ROD_one/actions/accept`,`${visit}/../orders/ROD_one`,`${visit}/baskets/RBA_one/extra`])expect(guestRoute(path,"POST")).toBe(false);
  });
  it("bounds exact body, revisions, quotes and grouped selections",()=>{
    const edit={operation_key:"once",expected_revision:1,selections,fulfillment_method:"pickup",window_ref:"RWI_one",food_preference:"No salt"};
    expect(guestBody(basket,edit)).toBe(true);expect(guestBody(`${basket}/quote`,edit)).toBe(false);
    expect(guestBody(`${basket}/quote`,{...edit,food_preference:undefined})).toBe(false);
    for(const changes of [{table_ref:"x"},{payment_verified:true},{fulfillment_method:"delivery"},{expected_revision:0},{operation_key:""},{selections:{...selections,standalone:Array(51).fill(selections.standalone[0])}},{food_preference:"x".repeat(401)}])expect(guestBody(basket,{...edit,...changes})).toBe(false);
    expect(guestBody(`${basket}/submit`,{operation_key:"submit",expected_revision:2,quote_ref:"RQU_one",confirm:true})).toBe(true);
    expect(guestBody(`${visit}/orders/ROD_one/cancel`,{operation_key:"cancel",expected_revision:1,reason:"customer_cancelled"})).toBe(true);
  });
  it("never forwards Personal, Business or Authorization; public entry has no cookie",async()=>{
    const fetcher=vi.fn<typeof fetch>(async()=>Response.json({visit_ref:"RGV_one",rounds:[]}));vi.stubGlobal("fetch",fetcher);
    const response=await GET(req(visit,"GET",undefined,{Authorization:"Bearer personal"}),ctx(visit));expect(response.status).toBe(200);
    const headers=fetcher.mock.calls[0][1]!.headers as Record<string,string>;expect(headers.Cookie).toBe(cookie);expect(headers.Authorization).toBeUndefined();expect(JSON.stringify(headers)).not.toContain("business");
    await GET(req(`${base}/entry`),ctx(`${base}/entry`));expect((fetcher.mock.calls[1][1]!.headers as Record<string,string>).Cookie).toBeUndefined();
    expect(response.headers.get("cache-control")).toBe("private, no-store");expect(response.headers.get("vary")).toBe("Cookie, Origin");
  });
  it("rewrites creation and deletion only to the exact browser visit cookie path",async()=>{
    const raw=`${cookie}; HttpOnly; Max-Age=31622400; Path=/api/restaurant-guests/${visit}; SameSite=strict; Secure`;
    vi.stubGlobal("fetch",vi.fn(async()=>Response.json({visit_ref:"RGV_one"},{headers:{"Set-Cookie":raw}})));
    const create=await POST(req(`${base}/visits`,"POST",{entry_context:"context"}),ctx(`${base}/visits`));
    expect(create.headers.get("set-cookie")).toContain(`/api/shida/restaurant-guests/${visit};`);expect(await create.json()).not.toHaveProperty("authority");
    const deletion=`${GUEST_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/api/restaurant-guests/${visit}; SameSite=strict; HttpOnly; Secure`;
    vi.stubGlobal("fetch",vi.fn(async()=>Response.json({visit_ref:"RGV_one"},{headers:{"Set-Cookie":deletion}})));
    expect((await DELETE(req(visit,"DELETE"),ctx(visit))).headers.get("set-cookie")).toContain(`Path=/api/shida/restaurant-guests/${visit}`);
    for(const malformed of [raw.replace("RGV_one","RGV_other"),raw.replace("; Secure",""),raw.replace("; HttpOnly",""),raw+"; Domain=nihiloba.com",raw.replace(`/visits/RGV_one`,"")])expect(guestSetCookie(malformed,"RST_one","RGV_one")).toBeNull();
  });
  it("fails closed on lost/ambiguous cookie, HTTP upstream, disallowed query and Origin",async()=>{
    const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
    expect((await GET(req(visit,"GET",undefined,{Cookie:"personal=token"}),ctx(visit))).status).toBe(404);
    expect((await GET(req(visit,"GET",undefined,{Cookie:`${cookie}; ${cookie}`}),ctx(visit))).status).toBe(404);
    const missing=req(`${visit}/close`,"POST");missing.headers.delete("origin");expect((await POST(missing,ctx(`${visit}/close`))).status).toBe(403);
    expect((await POST(req(`${visit}/close`,"POST",undefined,{Origin:"https://evil.test"}),ctx(`${visit}/close`))).status).toBe(403);
    expect((await GET(req(`${visit}?language=en`),ctx(visit))).status).toBe(422);
    expect((await GET(req(`${base}/entry?language=en&language=fr`),ctx(`${base}/entry`))).status).toBe(422);
    expect(fetcher).not.toHaveBeenCalled();vi.stubEnv("SHIDA_API_BASE_URL","http://localhost:1234");
    expect((await GET(req(visit),ctx(visit))).status).toBe(503);
  });
  it("preserves private errors, Retry-After and sanitized errors on late failure",async()=>{
    vi.stubGlobal("fetch",vi.fn(async()=>Response.json({detail:"PRIVATE_SENTINEL",content:"SECRET"},{status:429,headers:{"Retry-After":"60"}})));
    const response=await PATCH(req(basket,"PATCH",{operation_key:"edit",expected_revision:1,selections,fulfillment_method:"pickup"}),ctx(basket));
    expect(response.status).toBe(429);expect(response.headers.get("retry-after")).toBe("60");expect(await response.text()).not.toContain("SECRET");expect(response.headers.get("cache-control")).toBe("private, no-store");
    vi.stubGlobal("fetch",vi.fn(async()=>{throw Error("secret response lost");}));const late=await GET(req(visit),ctx(visit));expect(late.status).toBe(503);expect(late.headers.get("vary")).toBe("Cookie, Origin");expect(await late.text()).not.toContain("secret");
    for(const fn of [PUT,HEAD,OPTIONS])expect(fn().headers.get("cache-control")).toBe("private, no-store");
  });
  it("accepts a fully bounded plate envelope and rejects an oversized streamed body",async()=>{
    const fetcher=vi.fn<typeof fetch>(async()=>Response.json({basket:{revision:2}}));vi.stubGlobal("fetch",fetcher);
    const full={standalone:Array.from({length:50},(_,i)=>({key:`line-${i}`,item_ref:"RMI_"+"x".repeat(60),quantity:1})),plates:Array.from({length:20},(_,i)=>({key:`plate-${i}`,components:Array.from({length:20},(_,j)=>({key:`component-${i}-${j}`,item_ref:"RMI_"+"x".repeat(60),selected_amount:"1000.00"}))}))};
    const response=await PATCH(req(basket,"PATCH",{operation_key:"full",expected_revision:1,selections:full,fulfillment_method:"pickup"}),ctx(basket));expect(response.status).toBe(200);
    const oversized=await PATCH(req(basket,"PATCH",{operation_key:"x".repeat(262145)}),ctx(basket));expect(oversized.status).toBe(413);expect(oversized.headers.get("cache-control")).toBe("private, no-store");
  });
  it("fails closed if an upstream creation ever violates the no-authority-in-JSON contract",async()=>{
    vi.stubGlobal("fetch",vi.fn(async()=>Response.json({visit_ref:"RGV_one",authority:"PRIVATE_SENTINEL"})));
    const response=await POST(req(`${base}/visits`,"POST",{entry_context:"context"}),ctx(`${base}/visits`));expect(response.status).toBe(502);expect(await response.text()).not.toContain("PRIVATE_SENTINEL");
  });
});
describe("uncertain original operation",()=>{
  it("rereads visit and basket before replaying the unchanged quote/revision/key",async()=>{
    const fetcher=vi.fn<typeof fetch>(async()=>Response.json({order_ref:null}));vi.stubGlobal("fetch",fetcher);
    const action=guestAction("/visits/RGV_one/baskets/RBA_one/submit","POST",{operation_key:"same",expected_revision:7,quote_ref:"RQU_original",confirm:true});
    await replayGuestAction("RST_one","RGV_one",action);
    expect(fetcher.mock.calls.map(c=>c[0])).toEqual([`/api/shida/restaurant-guests/${visit}/`,`/api/shida/restaurant-guests/${basket}/`,`/api/shida/restaurant-guests/${basket}/submit/`]);
    expect(fetcher.mock.calls[2][1]!.body).toBe(action.body);expect(Object.isFrozen(action)).toBe(true);
  });
  it("cannot replay after lost authority",async()=>{
    const fetcher=vi.fn(async()=>Response.json({detail:"restaurant_unavailable"},{status:404}));vi.stubGlobal("fetch",fetcher);
    await expect(replayGuestAction("RST_one","RGV_one",guestAction("/visits/RGV_one/baskets","POST",{operation_key:"same"}))).rejects.toMatchObject({status:404});expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("recovers the immutable order already linked to a submitted basket without another write",async()=>{
    const fetcher=vi.fn<typeof fetch>(async()=>Response.json({order_ref:"ROD_one"}));vi.stubGlobal("fetch",fetcher);
    const value=await replayGuestAction<{current_order:{order_ref:string}}>("RST_one","RGV_one",guestAction("/visits/RGV_one/baskets/RBA_one/submit","POST",{operation_key:"same",expected_revision:7,quote_ref:"RQU_original",confirm:true}));
    expect(value.current_order.order_ref).toBe("ROD_one");expect(fetcher.mock.calls[2][0]).toContain("/orders/ROD_one");expect(fetcher.mock.calls.every(c=>!c[1]?.method || c[1].method==="GET")).toBe(true);
  });
});
