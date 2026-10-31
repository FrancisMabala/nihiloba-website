import {test,expect,type Page} from '@playwright/test';
import {workplaceCopy} from '../../app/lib/services-workplace-copy';
import {servicesProviderOffering} from './fixtures/services-provider';
import QRCode from 'qrcode';
async function fixture(page:Page){
 const rows=[{...servicesProviderOffering,name:'Horizon Practice (test)',provider_ref:'SVI_test',visible_to_customers:true,professional_profile:{name:'Horizon Practice (test)',bio:'Independent professional',photo:null,social_link:''},professional_settings:{} as Record<string,unknown>}];
 const writes:unknown[]=[];const targets:string[]=[];
 await page.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Private account'}});
 if(path.endsWith('/capabilities'))return reply({capabilities:['profile','packages','structured_availability','bills','manual_journal','basic_totals']});
 if(path.endsWith('/reviews'))return reply({reviews:[]});
 if(path.endsWith('/personal/services'))return reply({profiles:rows});
 if(path.endsWith('/professional-work')){const body=req.postDataJSON();writes.push(body);rows[0].professional_settings=body.professional_settings;rows[0].revision++;return reply(rows[0]);}
 if(path.endsWith('/share')){const target=url.searchParams.get('target')!;targets.push(target);const link='https://nihiloba.com/shida/services/'+(target==='profile'?'providers/SVI_test':'SVC_one#booking');return reply({name:target==='profile'?rows[0].name:rows[0].service_name,url:link,qr_image:await QRCode.toDataURL(link)});}
 if(path.endsWith('/registration-reference'))return reply(url.searchParams.get('resource')==='locations'?{kinshasa_communes:['Gombe','Lemba'],address_config:{international_optional:[]}}:{countries:[{code:'CD',name:'Congo-Kinshasa'}]});
 if(path.endsWith('/counter'))return reply({sales:[],next_offset:null});
 if(path.endsWith('/bill-presentation'))return reply({preview:{display_name:rows[0].name}});
 return reply({},404);
 });return {rows,writes,targets};
}
for(const [locale,width] of [['en',1440],['fr',390],['ln',768],['sw',360]] as const)test(`work preferences and stable sharing ${locale} ${width}`,async({page})=>{
 const state=await fixture(page),t=workplaceCopy[locale];await page.setViewportSize({width,height:1000});const prefix=locale==='en'?'':`/${locale}`;
 await page.goto(prefix+'/shida/seller/services?view=services');await page.getByRole('button',{name:t.edit,exact:true}).click();
 await page.getByLabel(t.customer,{exact:false}).check();await page.getByLabel(t.remote,{exact:false}).check();
 await expect(page.getByLabel(t.name,{exact:true})).toHaveCount(0);
 await page.getByRole('switch').uncheck();await page.screenshot({path:`test-results/workplace-mobile-provider-${locale}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.review}).click();await page.getByRole('button',{name:t.save}).click();
 await expect(page.locator('.svc-work-summary')).toContainText(t.remote);expect(state.rows[0].professional_settings.counter_enabled).toBe(false);expect(state.writes).toHaveLength(1);
 await page.goto(prefix+'/shida/seller/services?view=share');await expect(page.locator('.svc-sharing-qr img')).toBeVisible();await expect(page.locator('.svc-sharing-actions input')).toHaveValue(/providers\/SVI_test/);
 await page.screenshot({path:`test-results/sharing-profile-${locale}-${width}.png`,fullPage:true});
 const download=page.waitForEvent('download');await page.getByRole('link',{name:t.download}).click();expect((await download).suggestedFilename()).toBe('shida-profile-qr.png');
 await page.getByRole('button',{name:t.service,exact:true}).click();await expect(page.locator('.svc-sharing-actions input')).toHaveValue(/SVC_one#booking/);
 await expect(page.getByRole('link',{name:t.whatsapp})).toHaveAttribute('href',/wa.me/);
 await page.screenshot({path:`test-results/sharing-service-${locale}-${width}.png`,fullPage:true});expect(state.targets).toContain('profile');expect(state.targets).toContain('service');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('workplace consent remains explicit and multiple modes remain selectable',async({page})=>{
 await fixture(page);await page.goto('/shida/seller/services?view=services');await page.getByRole('button',{name:workplaceCopy.en.edit}).click();await page.getByLabel(workplaceCopy.en.workplace,{exact:false}).check();await expect(page.getByLabel(workplaceCopy.en.consent)).not.toBeChecked();await page.getByLabel(workplaceCopy.en.name,{exact:true}).fill('Office (test)');await page.getByLabel(workplaceCopy.en.remote,{exact:false}).check();await page.screenshot({path:'test-results/workplace-private-desktop.png',fullPage:true});await page.getByLabel(workplaceCopy.en.consent).check();await page.screenshot({path:'test-results/workplace-public-desktop.png',fullPage:true});await page.getByLabel(workplaceCopy.en.workplace,{exact:false}).uncheck();await expect(page.getByLabel(workplaceCopy.en.consent)).toHaveCount(0);
});
