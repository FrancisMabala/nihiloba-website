import {test,expect} from "@playwright/test";
import {readFile} from "node:fs/promises";

for(const width of [390,1440])test("French provider finances at "+width,async({page})=>{
  await page.setViewportSize({width,height:940});
  const service={public_ref:"SVC_one",provider_ref:"SVI_one",name:"Atelier Grâce",service_name:"Coiffure",category:"beauty",is_active:"yes",requests_enabled:true,revision:1,packages:[],rating:{average:null,count:0}};
  const writes:Record<string,string>[]=[];
  await page.route("**/api/shida/**",async route=>{
    const url=new URL(route.request().url()), path=url.pathname.replace(/\/$/,"");
    const reply=(json:unknown)=>route.fulfill({json});
    if(path.endsWith("/employment/session"))return reply({binding:"a".repeat(64),user:{display_name:"Atelier Grâce"}});
    if(path.endsWith("/capabilities"))return reply({capabilities:["profile","manual_journal","basic_totals","operational_reports","financial_reports"]});
    if(path.endsWith("/onboarding"))return reply({progress:[],remaining_capacity:4,professional_profile:{public_ref:"SVI_one",name:"Atelier Grâce"}});
    if(path.endsWith("/services"))return reply({profiles:[service]});
    if(path.endsWith("/reviews"))return reply({reviews:[]});
    if(path.endsWith("/finance/workspace")){
      if(route.request().method()==="POST"){writes.push(route.request().postDataJSON());return reply({ref:"SFE_due"});}
      const day=url.searchParams.get("end_date")!;
      return reply({start:url.searchParams.get("start_date"),end:day,currency:url.searchParams.get("currency"),previous:day,previous_end:day,previous_received:"300000",totals:{billed:"410000",received:"360000",spent:"60000",outstanding:"50000"},days:[{day,billed:"410000",received:"360000",spent:"60000"}],methods:{cash:"360000"},categories:{utilities:"60000"},entries:[],jobs:[],advances:[],closes:[],dues:writes.map((w,i)=>({...w,ref:"SFE_"+i,due:w.day}))});
    }
    return reply({});
  });
  await page.goto("/fr/shida/seller/services/?view=finance");
  const area=page.locator(".sf-workspace");
  await expect(area.getByText("Flux de trésorerie")).toBeVisible();
  await area.getByRole("button",{name:"Dépenses",exact:true}).click();
  await area.getByLabel("Libellé").fill("Électricité");
  await area.getByLabel("Fréquence").selectOption("monthly");
  await area.getByLabel("Montant prévu").fill("35000");
  await area.getByLabel("Catégorie").selectOption("utilities");
  await area.getByRole("button",{name:"Enregistrer l’échéance"}).click();
  await expect(area.getByText("À confirmer",{exact:true})).toBeVisible();
  expect(writes[0]).toMatchObject({kind:"schedule",currency:"CDF",amount:"35000",category:"utilities"});
  await area.getByRole("button",{name:"Rapports",exact:true}).click();
  await area.getByRole("button",{name:"Cette semaine",exact:true}).click();
  await expect(area.getByRole("columnheader",{name:"Facturé (CDF)"})).toBeVisible();
  const downloadPromise=page.waitForEvent("download");
  await area.getByRole("button",{name:"Exporter le détail (CSV)"}).click();
  const file=await (await downloadPromise).path();
  expect(await readFile(file!,"utf8")).toContain('"Total","410000","360000","60000"');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
