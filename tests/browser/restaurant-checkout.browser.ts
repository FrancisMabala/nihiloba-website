import { test, expect } from "@playwright/test";

for(const committedBeforeDisconnect of [true,false]) test(`phone checkout composes a plate, signs in, quotes, and recovers ${committedBeforeDisconnect?"a committed order":"an unreceived submission"}`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{window.open=()=>null;});
 let signedIn=false,revision=1,submitAttempts=0,created=false;
 let selections:{standalone:unknown[];plates:{key:string;components:unknown[]}[]}={standalone:[],plates:[]};
 let quote:Record<string,unknown>|null=null,orderRef:string|null=null;
 const basket=()=>({basket_ref:"RBA-CHECKOUT",establishment_ref:"RST-CHECKOUT",entry_source:"customer",channel:"web",revision,selections,quote,quote_ref:quote?"RQU-CHECKOUT":null,order_ref:orderRef,food_preference:null,fulfillment_method:"pickup",window_ref:"RWI-CHECKOUT"});
 await page.route("**/api/shida/employment/session/**",route=>route.fulfill({status:signedIn?200:401,json:signedIn?{user:{display_name:"Fixture customer"},binding:"a".repeat(64)}:{}}));
 await page.route("**/api/shida/personal/auth/whatsapp/**",route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,"");if(path.endsWith("/session")){signedIn=true;return route.fulfill({json:{authenticated:true}});}if(route.request().method()==="POST")return route.fulfill({json:{challenge_ref:"DWC_fixture",expires_at:new Date(Date.now()+300000).toISOString(),whatsapp_url:"https://wa.me/fixture"}});return route.fulfill({json:{status:"verified"}});});
 await page.route("**/api/shida/personal/restaurant-orders/**",route=>{const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,"");const method=req.method(),body=req.postDataJSON?.()??{};
  const respond=(json:unknown,status=200)=>route.fulfill({status,json});
  if(method==="POST"&&path.endsWith("/baskets")){created=true;return respond(basket());}
  if(method==="GET"&&path.endsWith("/RBA-CHECKOUT"))return respond(basket());
  if(method==="PATCH"){revision++;selections=body.selections;quote=null;return respond({basket:basket(),operation_outcome:{revision}});}
  if(method==="POST"&&path.endsWith("/quote")){revision++;const standalone=selections.standalone.map((line:any)=>({...line,name:"Fufu",pricing_model:"UNIT_PRICED",currency:"CDF",sale_unit_label:"boule",unit_price:"1000.00",subtotal:"1000.00"}));const plates=selections.plates.map((plate:any)=>({key:plate.key,subtotal:"1000.00",components:plate.components.map((line:any)=>({...line,name:"Pondu",pricing_model:"AMOUNT_PRICED",currency:"CDF",subtotal:"1000.00"}))}));quote={standalone,plates,food_subtotal:"2000.00",delivery_fee:null,order_total:"2000.00",currency:"CDF",fulfillment_method:"pickup",pickup_window:{starts_at:"2027-01-01T10:00:00Z",ends_at:"2027-01-01T12:00:00Z"},pickup_location:"Public pickup point",establishment_name:"Checkout Malewa"};return respond({basket:basket(),operation_outcome:{quote_ref:"RQU-CHECKOUT",revision}});}
  if(method==="POST"&&path.endsWith("/submit/pickup")){submitAttempts++;if(submitAttempts===1){if(committedBeforeDisconnect)orderRef="ROD-CHECKOUT";return route.abort();}orderRef="ROD-CHECKOUT";return respond({current_order:{order_ref:orderRef,state:"pending"}});}
  if(method==="POST"&&path.endsWith("/operations/recover"))return orderRef?respond({operation_outcome:{order_ref:orderRef},current:basket()}):respond({detail:"restaurant_operation_expired"},409);
  if(method==="GET"&&path.endsWith("/ROD-CHECKOUT"))return respond({order_ref:orderRef,state:"pending",revision:1,entry_source:"customer",channel:"web",fulfillment_method:"pickup",submitted_at:"2026-10-08T10:00:00Z",cancellation_pending:false,payment_verified:false,receipt_terms:quote});
  return respond({detail:"restaurant_unavailable"},404);
 });
 await page.goto("/shida/restaurants/RST-CHECKOUT/menu");
 await page.getByRole("link",{name:"Order food"}).click();
 await expect(page.getByRole("heading",{name:"Checkout Malewa · Order food"})).toBeVisible();
 await page.getByRole("article").filter({hasText:"Fufu"}).getByRole("button",{name:"Add"}).click();
 await page.getByRole("article").filter({hasText:"Pondu"}).getByRole("button",{name:"Add"}).click();
 await page.getByRole("button",{name:"Basket"}).click();
 await expect(page.getByRole("heading",{name:"Plate 1"})).toBeVisible();
 await page.getByRole("button",{name:"Continue",exact:true}).click();
 await page.getByRole("button",{name:"Continue with WhatsApp"}).click();
 await expect(page.getByText("Fixture customer")).toHaveCount(0);
 await expect.poll(()=>signedIn).toBe(true);
 await page.getByRole("combobox",{name:"Choose a window"}).selectOption("RWI-CHECKOUT");
 await page.getByRole("button",{name:"Get current quote"}).click();
 await expect(page.getByText("2000.00 CDF").first()).toBeVisible();
 await page.getByRole("button",{name:"Confirm order"}).click();
 await expect(page.getByRole("heading",{name:"Order sent to the restaurant. It is pending acceptance."})).toBeVisible();
 expect(created).toBe(true);expect(submitAttempts).toBe(committedBeforeDisconnect?1:2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole("link",{name:"Order details"}).click();
 await expect(page.getByText("Payment not verified.")).toBeVisible();
});
