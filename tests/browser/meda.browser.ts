import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {medaParticipationCopy} from '../../app/lib/meda-participation-copy';
import {medaCopy} from '../../app/lib/meda-copy';
const listing={reference:'MED_fixture',status:'published',title:'Paris → Kinshasa · 10 kg',side:'offer',category:'luggage',origin_country:'FR',origin_city:'Paris',destination_country:'CD',destination_city:'Kinshasa',departure_at:'2027-02-20T14:00:00Z',deadline_at:'2027-02-19T14:00:00Z',capacity:'10',unit:'kg',description:'Clothing and books. Collection details discussed privately.',price:'8',currency:'EUR',price_basis:'kg'};
async function fixtures(page:Page,signedIn=true){
 let draft:Record<string,unknown>|null=null;const writes:{path:string;body:Record<string,unknown>}[]=[];
 await page.route('**/api/shida/**',async route=>{const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  if(path==='/api/shida/employment/session')return route.fulfill(signedIn?{json:{binding:'a'.repeat(64),user:{display_name:'Meda visitor'}}}:{status:401,json:{}});
  if(path==='/api/shida/registration-reference'){const q=url.searchParams.get('q')??'';return route.fulfill({json:{items:q.toLowerCase().startsWith('f')?[{code:'FR',name:'France'}]:[{code:'CD',name:'Congo (RDC)'}]}});}
  if(path==='/api/shida/personal/meda/discovery')return route.fulfill({json:{items:[listing],page:1,has_more:false}});
  if(path==='/api/shida/personal/meda/discovery/MED_fixture')return route.fulfill({json:listing});
  if(path==='/api/shida/personal/meda/listings'&&req.method()==='GET')return route.fulfill({json:{items:draft?[draft]:[],page:1,has_more:false}});
  if(path==='/api/shida/personal/meda/listings'&&req.method()==='POST'){const body=req.postDataJSON();writes.push({path,body});draft={...body.values,reference:'MED_draft',status:'draft',revision:1};return route.fulfill({json:draft});}
  if(path==='/api/shida/personal/meda/listings/MED_draft'){const body=req.postDataJSON();writes.push({path,body});draft={...draft,status:body.action==='publish'?'published':'closed',revision:2};return route.fulfill({json:draft});}
  if(path==='/api/shida/personal/meda/photos'){await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({json:{reference:'MPH_fixture'}});}
  if(path.endsWith('/MPH_fixture'))return route.fulfill({status:404});
  if(path.endsWith('/enquiries')&&req.method()==='POST'){const body=req.postDataJSON();writes.push({path,body});return route.fulfill({json:{reference:'MEQ_fixture',revision:2,status:'open',listing,role:'requester',can_reply:true,unread:0,messages:[{reference:'MEM_fixture',body:body.body,mine:true,created_at:'2027-01-01T12:00:00Z'}],older:null}});}
  if(path==='/api/shida/personal/meda/enquiries')return route.fulfill({json:{items:[],page:1,has_more:false}});
  return route.fulfill({status:404,json:{}});
 });return writes;
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1440])test(`Meda discovery and enquiry ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const writes=await fixtures(page);const t=medaCopy[locale];
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/meda/`);
 await expect(page.getByRole('heading',{name:t.title})).toBeVisible();await expect(page.getByRole('heading',{name:listing.title})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const x=medaParticipationCopy[locale];await page.getByRole('button',{name:t.details}).click();
 await expect(page.getByRole('button',{name:x.send,exact:true})).toBeDisabled();
 await page.locator('input[type=file]').setInputFiles({name:'objects.png',mimeType:'image/png',buffer:Buffer.from('synthetic browser fixture')});
 await page.getByLabel(x.contents,{exact:true}).fill('Printed books in a small box');await page.getByLabel(x.weight,{exact:true}).fill('3');await page.getByLabel(x.packages,{exact:true}).fill('1');
 await expect(page.getByRole('button',{name:x.send,exact:true})).toBeEnabled();await expect(page.getByRole('textbox',{name:x.contents,exact:true})).toHaveValue('Printed books in a small box');
 await page.getByRole('button',{name:x.send,exact:true}).click();await expect(page.locator('.meda-conversation')).toBeVisible();
 expect(writes.at(-1)?.body.objects).toMatchObject({photos:['MPH_fixture'],weight_kg:'3',packages:1});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'){mkdirSync('docs/evidence/meda',{recursive:true});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`docs/evidence/meda/enquiry-${width}.png`,fullPage:true});}
});
test('signed-out users see explanation without listing data',async({page})=>{
 await fixtures(page,false);await page.goto('/shida/meda/');await expect(page.getByRole('heading',{name:listing.title})).toHaveCount(0);
 await expect(page.getByText(medaCopy.en.login).last()).toBeVisible();
});
