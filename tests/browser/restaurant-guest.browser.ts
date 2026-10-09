import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { checkoutCopy } from "../../app/lib/restaurant-checkout-copy";
import { guestText } from "../../app/lib/restaurant-guest-copy";
import type { RestaurantLocale } from "../../app/services/shida/restaurants-client";

test.skip(process.env.RESTAURANT_GUEST_BACKEND !== "1","Requires the isolated 09B1 real Backend TLS fixture");
const backend="https://localhost:3443";
type Seed={ref:string;qr:string;food:string;window:string};
async function control(request:APIRequestContext,path:string,data?:unknown) {
  const response=await request.post(`${backend}/__guest/${path}`,{data});
  expect(response.ok()).toBe(true);return response.json();
}
const guest=(page:Page)=>page.locator("#guest-order");
async function seed(request:APIRequestContext):Promise<Seed> {return control(request,"seed");}
async function enter(page:Page,s:Seed,locale:RestaurantLocale="en") {
  await page.goto(locale==="en"?s.qr:`/${locale}/shida/restaurants/${s.ref}`);
  await expect(guest(page).getByRole("button",{name:guestText(locale,"start")})).toBeVisible({timeout:15000});
  await guest(page).getByRole("button",{name:guestText(locale,"start")}).click();
  await expect(guest(page).getByRole("heading",{name:checkoutCopy[locale].basket,exact:true})).toBeVisible();
}
async function quote(page:Page,locale:RestaurantLocale="en",plate=false) {
  const scope=guest(page),t=checkoutCopy[locale];
  await scope.getByRole("article").filter({has:page.getByRole("heading",{name:"Fufu",exact:true})}).getByRole("button",{name:t.add,exact:true}).click();
  if(plate)await scope.getByRole("article").filter({has:page.getByRole("heading",{name:"Pondu",exact:true})}).getByRole("button",{name:t.add,exact:true}).click();
  const select=scope.getByRole("combobox",{name:t.window});
  await select.selectOption({index:1});
  await scope.getByRole("textbox",{name:t.preference}).fill("No salt");
  await scope.getByRole("button",{name:t.quote,exact:true}).click();
  await expect(scope.getByRole("button",{name:t.confirm,exact:true})).toBeVisible();
}
async function submit(page:Page,locale:RestaurantLocale="en") {
  const before=await guest(page).locator(".rst-guest-round").count();
  await guest(page).getByRole("button",{name:checkoutCopy[locale].confirm,exact:true}).click();
  await expect(guest(page).locator(".rst-guest-round")).toHaveCount(before+1);
  return (await guest(page).locator(".rst-guest-round").last().getAttribute("aria-label"))!.replace(`${checkoutCopy[locale].orderRef} `,"");
}
async function refresh(page:Page) {await page.evaluate(()=>window.dispatchEvent(new Event("focus")));}

test("general QR, independent guests, immutable repeat rounds, ready-only pickup and separate currencies on phone",async({page,browser,request})=>{
  const s=await seed(request);await page.setViewportSize({width:390,height:844});await enter(page,s);
  expect(page.url()).toContain(`/shida/restaurants/${s.ref}`);
  const cookies=(await page.context().cookies()).filter(c=>c.name==="__Secure-restaurant-visit");
  expect(cookies.length).toBe(1);expect(cookies[0].httpOnly && cookies[0].secure && cookies[0].sameSite==="Strict").toBe(true);
  expect(cookies[0].path.startsWith(`/api/shida/restaurant-guests/establishments/${s.ref}/visits/`)).toBe(true);
  expect(await page.evaluate(()=>document.cookie.includes("__Secure-restaurant-visit"))).toBe(false);
  expect((await page.context().cookies()).some(c=>c.name.includes("dashboard"))).toBe(false);
  await quote(page,"en",true);const first=await submit(page);
  await expect(guest(page).getByText("Awaiting acceptance",{exact:false})).toBeVisible();
  await expect(guest(page).getByRole("button",{name:"Pickup code",exact:true})).toHaveCount(0);
  const secondContext=await browser.newContext({baseURL:"https://localhost:3014",ignoreHTTPSErrors:true,viewport:{width:320,height:740}});
  const other=await secondContext.newPage();await enter(other,s);
  expect(await other.locator(".rst-guest-round").count()).toBe(0);
  const otherCookie=(await secondContext.cookies()).find(c=>c.name==="__Secure-restaurant-visit")!;
  expect(otherCookie.value===cookies[0].value).toBe(false);
  const otherVisit=otherCookie.path.split("/").at(-1);
  const inaccessible=await secondContext.request.get(`/api/shida/restaurant-guests/establishments/${s.ref}/visits/${otherVisit}/orders/${first}`);
  expect(inaccessible.status()).toBe(404);
  const missingOrigin=await page.context().request.post(`/api/shida/restaurant-guests/establishments/${s.ref}/visits/${cookies[0].path.split("/").at(-1)}/close`);
  expect(missingOrigin.status()).toBe(403);expect(missingOrigin.headers()["cache-control"]).toContain("private, no-store");
  for(const action of ["accept","start","ready"]) {await control(request,`${s.ref}/orders/${first}/${action}`);await refresh(page);await expect(guest(page).getByText(action==="accept"?"Accepted":action==="start"?"Preparing":"Ready",{exact:false}).first()).toBeVisible();}
  await guest(page).getByRole("button",{name:"Pickup code",exact:true}).click();
  await expect(page.locator(".rst-guest-code strong")).toBeVisible();
  const pickupCode=await page.locator(".rst-guest-code strong").innerText();
  await control(request,`${s.ref}/handoff/${first}`,{pickup_code:pickupCode});await refresh(page);
  await expect(page.locator(".rst-guest-code")).toHaveCount(0);
  await expect(page.getByText("Handed over",{exact:false}).first()).toBeVisible();
  await control(request,`${s.ref}/currency`);await page.reload();
  await guest(page).getByRole("button",{name:"Order more",exact:true}).click();
  await quote(page);const second=await submit(page);expect(first===second).toBe(false);
  await expect(guest(page).locator(".rst-guest-round")).toHaveCount(2);
  await expect(guest(page).locator(".rst-guest-totals")).toContainText("1500.25 CDF · 0.00 USD");
  await expect(guest(page).locator(".rst-guest-totals")).toContainText("0.00 CDF · 2.50 USD");
  const navigation=await page.evaluate(ref=>JSON.parse(sessionStorage.getItem(`restaurant-guest:${ref}`)!),s.ref);
  expect(Object.keys(navigation).sort()).toEqual(["basket","visit"]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:"docs/evidence/restaurant-guest-phone.png",fullPage:true,mask:[page.locator(".rst-guest-code")]});
  await secondContext.close();
});

for(const committed of [true,false])test(`reconnect rereads state and retries original uncertain submission (${committed?"committed":"unreceived"})`,async({page,request})=>{
  const s=await seed(request);await enter(page,s);await quote(page);
  let firstBody:string|null=null,attempts=0;
  await page.route("**/api/shida/restaurant-guests/**/submit/",async route=>{
    attempts++;
    if(attempts===1){firstBody=route.request().postData();if(committed)await route.fetch();return route.abort();}
    expect(route.request().postData()===firstBody).toBe(true);return route.continue();
  });
  await guest(page).getByRole("button",{name:"Confirm order",exact:true}).click();
  await expect(guest(page).getByRole("button",{name:guestText("en","retry")})).toBeVisible();
  await page.context().setOffline(true);await expect(guest(page).getByText(guestText("en","stale"))).toBeVisible();
  await page.context().setOffline(false);await guest(page).getByRole("button",{name:guestText("en","retry")}).click();
  await expect(page.locator(".rst-guest-round")).toHaveCount(1);expect(attempts).toBe(committed?1:2);
  await expect(guest(page).getByRole("button",{name:guestText("en","retry")})).toHaveCount(0);
});

test("stale quote, cancellation requests, rejection and expiry preserve canonical states",async({page,request})=>{
  const s=await seed(request);await enter(page,s);await quote(page);
  await control(request,`${s.ref}/price/${s.food}`);
  await guest(page).getByRole("button",{name:"Confirm order",exact:true}).click();
  await expect(guest(page).getByText(checkoutCopy.en.changed)).toBeVisible();
  expect(await page.locator(".rst-guest-round").count()).toBe(0);
  await guest(page).getByRole("button",{name:"Get current quote",exact:true}).click();const first=await submit(page);
  await control(request,`${s.ref}/orders/${first}/accept`);await control(request,`${s.ref}/orders/${first}/start`);await refresh(page);
  await expect(guest(page).getByRole("button",{name:"Request cancellation",exact:true})).toBeVisible();
  await guest(page).getByRole("button",{name:"Request cancellation",exact:true}).click();await expect(guest(page).getByText("Cancellation requested",{exact:true})).toBeVisible();
  await control(request,`${s.ref}/orders/${first}/approve_cancellation`);await refresh(page);await expect(guest(page).getByText("Cancelled",{exact:false}).first()).toBeVisible();
  await guest(page).getByRole("button",{name:"Order more",exact:true}).click();await quote(page);await submit(page);
  await guest(page).getByRole("button",{name:"Cancel order",exact:true}).click();await expect(page.locator(".rst-guest-round")).toHaveCount(2);
  await guest(page).getByRole("button",{name:"Order more",exact:true}).click();await quote(page);const rejected=await submit(page);await control(request,`${s.ref}/orders/${rejected}/reject`);await refresh(page);await expect(guest(page).getByText("Rejected",{exact:false}).first()).toBeVisible();
  await guest(page).getByRole("button",{name:"Order more",exact:true}).click();await quote(page);await submit(page);await control(request,"advance/11");await refresh(page);await expect(guest(page).getByText("Expired",{exact:false}).first()).toBeVisible();
  await expect(page.locator(".rst-guest-round")).toHaveCount(4);
  await expect(page.locator(".rst-guest-totals")).toContainText("4800.00 CDF · 0.00 USD");
});

test("lost authority clears receipts, draft, codes and navigation; forget never cancels orders",async({page,request})=>{
  const s=await seed(request);await enter(page,s);await quote(page);await submit(page);
  const cookie=(await page.context().cookies()).find(c=>c.name==="__Secure-restaurant-visit")!;
  await page.context().clearCookies();await refresh(page);
  await expect(page.locator(".rst-guest-round")).toHaveCount(0);await expect(guest(page).getByText(guestText("en","lost"))).toBeVisible();
  expect(await page.evaluate(ref=>sessionStorage.getItem(`restaurant-guest:${ref}`),s.ref)).toBeNull();
  await page.context().addCookies([cookie]);await enter(page,s);await quote(page);const round=await submit(page);
  page.once("dialog",d=>d.accept());await guest(page).getByRole("button",{name:"Forget private visit",exact:true}).click();
  await expect(page.locator(".rst-guest-round")).toHaveCount(0);
  await expect.poll(async()=>(await page.context().cookies()).filter(c=>c.name==="__Secure-restaurant-visit").length).toBe(1); // Only the earlier independent path remains.
  const result=await control(request,`${s.ref}/orders/${round}/accept`);expect(result.state).toBe("accepted");
});

for(const mode of ["closed","empty"])test(`truthful intake ${mode} has no account or invented window`,async({page,request})=>{
  const s=await seed(request);await control(request,`${s.ref}/intake/${mode}`);await page.goto(`/shida/restaurants/${s.ref}`);
  await expect(guest(page).getByRole("button",{name:"Start a private visit",exact:true})).toHaveCount(0);
  await expect(guest(page).getByText(mode==="closed"?guestText("en","closed"):checkoutCopy.en.noWindow)).toBeVisible();
});

for(const [locale,width] of [["fr",320],["en",390],["ln",768],["sw",1280]] as [RestaurantLocale,number][])test(`localized ${locale} guest order at ${width}px`,async({page,request})=>{
  const s=await seed(request);await page.setViewportSize({width,height:844});await enter(page,s,locale);await quote(page,locale,true);await submit(page,locale);
  await expect(guest(page).getByText(guestText(locale,"amounts"))).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`docs/evidence/restaurant-guest-${locale}-${width}.png`,fullPage:true});
});

test("rate limiting and temporary failure offer a bounded, explicit retry",async({page,request})=>{
  const s=await seed(request);let reads=0;
  await page.route("**/api/shida/restaurant-guests/**/entry/**",route=>{
    reads++;
    if(reads<=2)return route.fulfill({status:reads===1?429:503,json:{detail:"restaurant_unavailable"},headers:{"Cache-Control":"private, no-store","Retry-After":"1"}});
    return route.continue();
  });
  await page.goto(`/shida/restaurants/${s.ref}`);
  await expect(guest(page).getByText(guestText("en","rate"))).toBeVisible();
  await expect(guest(page).getByRole("button",{name:"Refresh",exact:true})).toBeDisabled();
  await expect(guest(page).getByRole("button",{name:"Refresh",exact:true})).toBeEnabled();
  await guest(page).getByRole("button",{name:"Refresh",exact:true}).click();await expect(guest(page).getByText(guestText("en","service"))).toBeVisible();
  await guest(page).getByRole("button",{name:"Refresh",exact:true}).click();await expect(guest(page).getByRole("button",{name:"Start a private visit",exact:true})).toBeVisible();
});

test("real visit basket limit stops new rounds and retains the existing canonical order",async({page,request})=>{
  const s=await seed(request);await enter(page,s);await quote(page);await submit(page);
  const nav=await page.evaluate(ref=>JSON.parse(sessionStorage.getItem(`restaurant-guest:${ref}`)!) as {visit:string},s.ref);
  for(let i=0;i<39;i++){
    const response=await page.context().request.post(`/api/shida/restaurant-guests/establishments/${s.ref}/visits/${nav.visit}/baskets/`,{headers:{Origin:"https://localhost:3014"},data:{operation_key:`limit-${i}`}});
    expect(response.ok()).toBe(true);
  }
  await guest(page).getByRole("button",{name:"Refresh",exact:true}).click();
  await expect(guest(page).getByRole("button",{name:"Order more",exact:true})).toBeDisabled();
  await expect(page.locator(".rst-guest-round")).toHaveCount(1);
  await expect(guest(page).getByText("Awaiting acceptance",{exact:false})).toBeVisible();
});

test("closing a visit stops rounds but preserves private order access and cancellation",async({page,request})=>{
  const s=await seed(request);await enter(page,s);await quote(page);await submit(page);
  page.once("dialog",d=>d.accept());await guest(page).getByRole("button",{name:"Stop new rounds",exact:true}).click();
  await expect(guest(page).getByRole("button",{name:"Order more",exact:true})).toBeDisabled();
  await expect(page.locator(".rst-guest-round")).toHaveCount(1);
  await guest(page).getByRole("button",{name:"Cancel order",exact:true}).click();await expect(guest(page).getByText("Cancelled",{exact:false}).first()).toBeVisible();
});

test("a confirmed submit keeps its reference when the subsequent summary read fails",async({page,request})=>{
  const s=await seed(request);await enter(page,s);await quote(page);
  const nav=await page.evaluate(ref=>JSON.parse(sessionStorage.getItem(`restaurant-guest:${ref}`)!) as {visit:string},s.ref);
  let fail=true;
  await page.route(`**/visits/${nav.visit}/`,route=>fail?route.fulfill({status:503,json:{detail:"restaurant_unavailable"},headers:{"Cache-Control":"private, no-store"}}):route.continue());
  await submit(page);await expect(guest(page).getByText(guestText("en","service"))).toBeVisible();
  await expect(guest(page).getByText("Awaiting acceptance",{exact:false})).toBeVisible();
  await expect(guest(page).getByRole("button",{name:guestText("en","retry")})).toHaveCount(0);
  await expect(page.locator(".rst-guest-totals")).toHaveCount(0);
  fail=false;await guest(page).getByRole("button",{name:"Refresh",exact:true}).click();
  await expect(page.locator(".rst-guest-totals")).toBeVisible();await expect(page.locator(".rst-guest-round")).toHaveCount(1);
});

test("phone guest ordering works with a constrained connection",async({page,request})=>{
  test.setTimeout(60000);
  const s=await seed(request);await page.setViewportSize({width:390,height:844});
  const network=await page.context().newCDPSession(page);await network.send("Network.enable");
  await network.send("Network.emulateNetworkConditions",{offline:false,latency:200,downloadThroughput:32*1024,uploadThroughput:16*1024,connectionType:"cellular3g"});
  await enter(page,s);await quote(page,"en",true);await submit(page);
  await expect(guest(page).getByText("Awaiting acceptance",{exact:false})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await network.detach();
});
