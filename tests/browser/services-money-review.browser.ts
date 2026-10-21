import {test,expect} from "@playwright/test";
import {financeReviewCopy} from "../../app/lib/services-finance-copy";
import {billReviewCopy} from "../../app/lib/services-bill-review-copy";
import {servicesText} from "../../app/components/shida/services-transaction-copy";

const words={
 en:{money:"Money received or spent",choose:"Choose a booking",amount:"Exact amount",bills:"Service bills",prepare:"Prepare bill",line:"Line description",billAmount:"Amount",save:"Save draft",issue:"Issue bill",due:"Due date",send:"Send bill"},
 fr:{money:"Argent reçu ou dépensé",choose:"Choisir une réservation",amount:"Montant exact",bills:"Factures de service",prepare:"Préparer la facture",line:"Description de ligne",billAmount:"Montant",save:"Enregistrer le brouillon",issue:"Émettre la facture",due:"Date d’échéance",send:"Envoyer la facture"},
 ln:{money:"Mbongo ozwi to obimisi",choose:"Pona rendez-vous",amount:"Motango ya sikisiki",bills:"Ba facture ya mosala",prepare:"Bongisa facture",line:"Ndimbola ya molongo",billAmount:"Motango",save:"Bomba brouillon",issue:"Bimisa facture",due:"Mokolo ya kofuta",send:"Tinda facture"},
 sw:{money:"Fedha zilizopokelewa au kutumika",choose:"Chagua nafasi",amount:"Kiasi halisi",bills:"Bili za huduma",prepare:"Andaa bili",line:"Maelezo ya mstari",billAmount:"Kiasi",save:"Hifadhi rasimu",issue:"Toa bili",due:"Tarehe ya malipo",send:"Tuma bili"},
} as const;
for(const [locale,width] of [["en",1440],["fr",390],["ln",820],["sw",320]] as const)test(`Personal money and bill review/retry ${locale}`,async({page})=>{
 const t=words[locale],f=financeReviewCopy[locale],c=billReviewCopy[locale],txText=(key:string)=>servicesText(locale,key);
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.setViewportSize({width,height:920});
 const offering={public_ref:"SVC_one",provider_ref:"SVI_one",name:"Sample provider",service_name:"Repairs",category:"repair_maintenance",description:"Careful repairs",service_duration_minutes:60,commune:"Gombe",service_location_type:"public_place",home_service_available:"yes",booking_mode:"flexible",availability:"Weekdays",publication_origin:"pilot",visible_to_customers:true,requests_enabled:true,is_active:"yes",revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
 const booking={reservation_ref:"RSV_one",offering_ref:"SVC_one",service_name:"Repairs",requester_name:"Sample customer",status:"confirmed",revision:1,can_respond:false};
 const entries:Record<string,unknown>[]=[],financeWrites:{body:string;key:string|undefined}[]=[],billWrites:string[]=[],versions:Record<string,unknown>[]=[],deliveries:Record<string,unknown>[]=[];
 let bill:Record<string,unknown>|null=null,failedMoney=true,failedBill=true,sendCount=0;

 await page.route("**/api/shida/**",async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,tx=path.split("/transactions/")[1];
  if(path.endsWith("/employment/session/"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Sample provider"}}});
  if(path.endsWith("/services/capabilities"))return route.fulfill({json:{bundle:"personal_free",access_policy:"pilot",purchase_required:false,capabilities:["profile","reservations","messages","manual_journal","basic_totals","bills"]}});
  if(!tx){if(path.endsWith("/reviews"))return route.fulfill({json:{reviews:[]}});if(path.endsWith("/services"))return route.fulfill({json:{profiles:[offering]}});return route.fulfill({status:404,json:{detail:"unavailable"}});}
  if(tx==="finance/entries"){
   if(req.method()==="GET")return route.fulfill({json:{entries,next_offset:null}});
   financeWrites.push({body:req.postData()!,key:req.headers()["idempotency-key"]});
   if(!entries.length)entries.push({entry_ref:"FEN_one",measure:"recorded_income",direction:1,amount:"12.25",currency:"CDF",effective_date:"2030-01-15",category:"service_income",private_note:null,evidence:"provider-declared",effect:"initial",correction_state:"original",reservation_ref:"RSV_one",association_kind:"job",recorded_at:"2030-01-15T23:30:00Z",original_entry_ref:null,revision:1});
   if(failedMoney){failedMoney=false;return route.abort("connectionreset");}
   return route.fulfill({json:{entries,replayed:true}});
  }
  if(tx==="reservations/RSV_one/bills"&&req.method()==="POST"){
   billWrites.push(req.postData()!);
   if(!bill){const input=req.postDataJSON();bill={bill_ref:"SBF_one",version_ref:"SBV_one",revision:1,status:"private_draft",source_kind:"accepted_quote",currency:"CDF",total:"12.25",due_date:null,lines:input.lines};versions.push(bill);}
   if(failedBill){failedBill=false;return route.abort("connectionreset");}
   return route.fulfill({json:bill});
  }
  if(tx==="reservations/RSV_one/bills/SBF_one/issue"){
   billWrites.push(req.postData()!);bill={...bill,version_ref:"SBV_two",revision:2,status:"issued",due_date:req.postDataJSON().due_date};versions.push(bill);return route.fulfill({json:bill});
  }
  if(tx==="reservations/RSV_one/bills/SBF_one/send"){
   sendCount++;deliveries.push({version_ref:"SBV_two",revision:2,status:"deferred_outside_service_window",attempts:0,created_at:"2030-01-16T09:00:00Z",can_retry:false});return route.fulfill({json:{deliveries}});
  }
  const values:Record<string,unknown>={requests:{requests:[],has_more:false},reservations:{reservations:[booking]},"reservations/RSV_one":booking,"reservations/RSV_one/lifecycle":{...booking,actions:[],rescheduling:{actions:[],proposal:null}},"reservations/RSV_one/bills":{bill_ref:bill?"SBF_one":null,current:bill},"bills/SBF_one/history":{versions},"bills/SBF_one/deliveries":{deliveries},templates:{templates:[]},messages:{threads:[]}};
  return route.fulfill({json:values[tx]??{requests:[],reservations:[],threads:[],currencies:{CDF:{},USD:{}}}});
 });
 await page.goto(`${locale==="en"?"":`/${locale}`}/shida/seller/services?view=finance`);
 const money=page.getByRole("region",{name:t.money,exact:true});
 await money.getByRole("combobox",{name:t.choose,exact:true}).selectOption("RSV_one");
 await money.getByLabel(t.amount,{exact:true}).fill("12,25");
 await money.getByRole("button",{name:f.review,exact:true}).click();
 expect(financeWrites).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/money-review-${locale}.png`,fullPage:true});
 await money.getByRole("button",{name:f.confirm,exact:true}).focus();await page.keyboard.press("Enter");
 await expect(money.getByText(f.uncertain,{exact:true})).toBeVisible();
 await expect(money.getByLabel(t.amount,{exact:true})).toBeDisabled();
 await money.getByRole("button",{name:f.retry,exact:true}).click();
 await expect(money.getByText(f.saved,{exact:true})).toBeVisible();
 expect(financeWrites).toHaveLength(2);expect(financeWrites[1]).toEqual(financeWrites[0]);
 await page.goto(`${locale==="en"?"":`/${locale}`}/shida/seller/services?view=work`);
 const workspace=page.getByRole("region",{name:txText("workspace"),exact:true});
 await workspace.getByRole("button",{name:txText("reservations"),exact:true}).click();
 await workspace.getByRole("button",{name:/Repairs/}).click();
 const bills=page.getByRole("region",{name:t.bills,exact:true});
 await bills.getByRole("button",{name:t.prepare,exact:true}).click();
 await bills.getByLabel(t.line,{exact:true}).fill("Agreed work");
 await bills.getByRole("button",{name:c.review,exact:true}).click();
 await expect(bills.getByText(c.incomplete,{exact:true})).toBeVisible();expect(billWrites).toHaveLength(0);
 await bills.getByLabel(t.billAmount,{exact:true}).fill("12,25");
 await bills.getByRole("button",{name:c.review,exact:true}).click();
 await expect(bills.getByText(`${c.total}: 12.25 CDF`,{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/bill-review-${locale}.png`,fullPage:true});
 await bills.getByRole("button",{name:t.save,exact:true}).click();
 await expect(bills.getByText(c.uncertain,{exact:true})).toBeVisible();
 await bills.getByRole("button",{name:c.retry,exact:true}).click();
 await expect(bills.getByRole("button",{name:t.issue,exact:true})).toBeVisible();
 expect(billWrites).toHaveLength(2);expect(billWrites[1]).toBe(billWrites[0]);expect(sendCount).toBe(0);
 await bills.getByRole("button",{name:t.issue,exact:true}).click();
 await bills.getByLabel(t.due,{exact:true}).fill("2030-01-20");
 await bills.getByRole("button",{name:c.review,exact:true}).click();
 expect(billWrites).toHaveLength(2);
 await bills.getByRole("button",{name:t.issue,exact:true}).click();
 await bills.getByRole("button",{name:t.send,exact:true}).click();
 await expect(bills.getByRole("heading",{name:c.account,exact:true})).toBeVisible();
 expect(sendCount).toBe(1);expect(billWrites).toHaveLength(3);expect(errors).toEqual([]);
});
