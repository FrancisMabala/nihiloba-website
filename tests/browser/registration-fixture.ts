import {expect,type Page} from '@playwright/test';
export async function fillName(page:Page,name:string){
 if(await page.locator('#registration-personal_name').count())return page.locator('#registration-personal_name').fill(name);
 const [first,...rest]=name.split(' ');await page.locator('#registration-first_name').fill(first);await page.locator('#registration-family_name').fill(rest.join(' ')||first);
}

export async function fillCountry(page:Page,code:string){
 await page.locator("#registration-country_code").fill(code);await expect(page.locator("#registration-country_code")).toHaveValue(code==="CD"?"Congo-Kinshasa":code==="SE"?"Sweden":code==="DE"?"Germany":code);if(await page.locator("#registration-commune").count())await page.locator("#registration-commune").selectOption("Gombe");
}

export async function fixture(page:Page,existing=false,business=false, onPersonalSession?:()=>Promise<void>){
 const state={verified:existing,revision:1,status:existing?'active':'not_started',values:{} as Record<string,string>,accepted:false,completed:false,stale:false,existingAccount:false,race:false};
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/api/shida/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,''),method=route.request().method();
  const reply=(value:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  if(path.includes('/public-jobs/'))return route.fallback();
  if(path.endsWith('/registration-reference')){
   if(url.searchParams.get('resource')==='locations')return reply({kinshasa_communes:['Gombe','Lemba',"N'djili"],quartiers:{},address_config:{international_optional:['region','postal_code','parcel_number']}});
   const rows=[{code:'CD',name:'Congo-Kinshasa'},{code:'CG',name:'Congo-Brazzaville'},{code:'SE',name:'Sweden'},{code:'DE',name:'Germany'}];
   const q=url.searchParams.get('q')||'';
   return reply({items:rows,matched_code:rows.find(row=>row.code===q.toUpperCase()||row.name.toLowerCase()===q.toLowerCase())?.code||null,...(method==='POST'?{status:'pending_review'}:{})});
  }
  const projection=()=>({onboarding_ref:business?'ONB_fixture':'POD_fixture',revision:state.revision,status:state.status,values:state.values,existing_account:state.existingAccount,organization_types:['company','school'],sectors:['commerce_distribution'],remaining_fields:(business?['name','organization_type','sector','personal_name','city','country_code','commune_or_municipality','street_or_avenue','building_or_parcel']:state.values.personal_name&&!state.values.first_name?['personal_name','city','country_code']:['first_name','family_name','city','country_code']).filter(key=>!state.values[key]),legal:[{document_type:'SHIDA_TERMS_OF_USE',version:'1',url:'https://nihiloba.com/shida/terms/1.0/',accepted:state.accepted},{document_type:'SHIDA_PRIVACY_POLICY',version:'1',url:'https://nihiloba.com/shida/privacy/1.0/',accepted:state.accepted},...(business?[{document_type:'SHIDA_BUSINESS_TERMS',version:'1',url:'https://nihiloba.com/shida/business/terms/1.0/',accepted:state.accepted}]:[])]});
  if(path.endsWith('/auth/whatsapp/registration')){expect(route.request().headers()['x-shida-eligibility']).toBe('adult-drc-v1');return reply({challenge_ref:'DWC_fixture_test',expires_at:new Date(Date.now()+300000).toISOString(),whatsapp_url:'https://wa.me/243000000000?text=synthetic-not-sent'},201);}
  if(path.includes('/auth/whatsapp/registration/DWC_')){if(path.endsWith('/session')){state.verified=true;return reply({verified:true});}return reply({status:'verified'});}
  if(path.includes('/registration/')){
   if(!state.verified)return reply({error:{code:'unauthorized'}},401);
   if(method==='POST'&&/\/registration\/(personal|business)$/.test(path)){state.status='active';if(state.race){state.revision=2;state.values={personal_name:'Concurrent Person',city:'Kinshasa',country_code:'CD'};}}
   if(path.endsWith('/finish/session')){await onPersonalSession?.();return reply({authenticated:true});}
   if(path.endsWith('/personal/consent'))state.accepted=true;
   if(path.endsWith('/business-handoff'))return reply({token:'x'.repeat(43)});
   if(path.endsWith('/complete')){state.completed=true;state.status='completed';return reply(projection());}
   if(path.endsWith('/cancel')){state.status='cancelled';return reply(projection());}
   if(method==='PATCH'){
    if(state.stale)return reply({error:{code:'stale_onboarding'}},409);
    const data=route.request().postDataJSON();expect(data.revision).toBe(state.revision);state.values={...state.values,...data.values};if(state.values.first_name&&state.values.family_name)state.values.personal_name=[state.values.first_name,state.values.family_name,state.values.additional_name].filter(Boolean).join(' ');if(state.values.city==='Kinshasa')state.values.country_code='CD';state.revision++;if(Object.keys(data.accept_documents??{}).length===(business?3:2))state.accepted=true;
   }
   return reply(projection());
  }
  return reply({},401);
 });
 return state;
}
