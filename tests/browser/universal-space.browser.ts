import {test,expect} from '@playwright/test';
for(const locale of ['en','fr','ln','sw'])for(const width of [360,390,768,1024,1440])test(`universal overview ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test account'}});
  if(path.endsWith('/security/navigation'))return reply({markets:['wenze','services','apartments'],organization_management:false});
  if(path.endsWith('/wenze/stores'))return reply({stores:url.searchParams.get('archived')==='true'?[]:[{public_ref:'WNZ_shop',name:'Actual shop',catalog_ready:true,status:'active',visible:'true'},{public_ref:'WNZ_individual',name:'Individual selling context',selling_mode:'individual',catalog_ready:true,status:'active',visible:'true'}]});
  if(path.endsWith('/restaurants'))return reply({items:[],total:0,actions:['create']});
  if(path.endsWith('/services'))return reply({profiles:[{public_ref:'SVC_one',provider_ref:'PRO_one',professional_profile:{name:'Shared professional identity'},service_name:'Legal advice',visible_to_customers:true},{public_ref:'SVC_two',provider_ref:'PRO_one',professional_profile:{name:'Shared professional identity'},service_name:'Business advice',visible_to_customers:true}]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  return reply({unread_count:0});
 });
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space?view=overview`);
 await expect(page.locator('.activities-slogan')).toHaveText('Misala na yo nyonso, na esika moko!');
 await expect(page.locator('.activities-summary a')).toHaveCount(2);
 await expect(page.locator('.activities-summary .summary-wenze strong')).toHaveText('1');
 await expect(page.locator('.activities-summary .summary-services strong')).toHaveText('1');
 await expect(page.locator('.activity-cards article')).toHaveCount(0);
 await expect(page.locator('.activities-summary .summary-services')).toHaveAttribute('href',/view=management#activities-services/);
 await expect(page.locator('.activities-dashboard a[href$="view=listings"]')).toHaveCount(1);
 await expect(page.locator('.activities-welcome')).toHaveCount(0);
 await expect(page.locator('.space-sidebar a[aria-current="page"]')).toHaveAttribute('href',/view=overview/);
 await page.locator('.activities-hero button').click();
 const property=page.locator('#new-activity-options a').filter({has:page.locator('svg path[d^="m3 10"]')});
 await expect(property).toHaveAttribute('href',/\/shida\/appartements\/publier\//);
 await expect(page.locator('#new-activity-options a[href*="business.nihiloba.com"]')).toHaveCount(0);
 const commands=await page.locator('#new-activity-options a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')||''));
 expect(commands.some(url=>/wewa\+on|chauffeur\+wewa|naza\+wewa|mimi\+ni\+boda/.test(url))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/universal-${locale}-${width}.png`,fullPage:true});
});

for(const width of [390,1440])test(`canonical activity totals ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test account'}});
  if(path.endsWith('/security/navigation'))return reply({markets:['wenze','services','apartments','jobs','hotels','wewa'],organization_management:false,activity_counts:{wenze:2,listings:3,services:1,restaurants:0,apartments:4,jobs:2,hotels:1,wewa:1}});
  if(path.endsWith('/wenze/stores'))return reply({stores:[]});
  if(path.endsWith('/restaurants'))return reply({items:[],total:0,actions:['create']});
  if(path.endsWith('/services'))return reply({profiles:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  return reply({unread_count:0});
 });
 await page.goto('/shida/space?view=overview');
 const summary=page.locator('.activities-summary');
 await expect(summary.locator('a')).toHaveCount(7);
 await expect(summary.locator('a[href$="view=listings"] strong')).toHaveText('3');
 await expect(summary.locator('.summary-services strong')).toHaveText('1');
 await expect(summary.locator('.summary-apartments strong')).toHaveText('4');
 await expect(summary.locator('.summary-jobs strong')).toHaveText('2');
 await expect(summary.locator('.summary-restaurants')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.route('**/security/navigation',route=>route.fulfill({json:{markets:['services'],organization_management:false,activity_counts:{services:1}}}));
 await page.reload();
 await expect(summary.locator('.summary-services')).toHaveAttribute('href','/shida/seller/services');
 await expect(page.locator('.activities-welcome')).toHaveCount(0);
});

for(const width of [390,1440])for(const drafts of [0,1])test(`empty container with ${drafts} saved drafts ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test account'}});
  if(path.endsWith('/security/navigation'))return reply({markets:drafts?['wenze']:[],organization_management:false,activity_counts:{wenze:0,listings:0,listing_drafts:drafts,apartments:0}});
  if(path.endsWith('/wenze/stores'))return reply({stores:[{public_ref:'WNZ_empty',name:'Internal container',selling_mode:'individual',status:'active',visible:'true',catalog_ready:true}]});
  if(path.endsWith('/restaurants'))return reply({items:[],total:0,actions:['create']});
  if(path.endsWith('/services'))return reply({profiles:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  return reply({unread_count:0});
 });
 await page.goto('/fr/shida/space?view=overview');
 await expect(page.locator('.activities-summary a')).toHaveCount(0);
 await expect(page.locator('.activities-dashboard a[href$="view=listings"]')).toHaveCount(drafts?1:0);
 await expect(page.locator('.activities-welcome')).toHaveCount(drafts?0:1);
 await expect(page.locator('.activity-existing-markets')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/empty-activity-${drafts}-${width}.png`,fullPage:true});
});
