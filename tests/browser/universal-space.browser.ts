import {test,expect} from '@playwright/test';
import {overviewCopy} from '../../app/lib/activity-overview-copy';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,390,768,1024,1440])test(`universal overview ${locale} ${width}`,async({page})=>{
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
  if(path.endsWith('/job-offer'))return reply({rows:[]});
  if(path.endsWith('/apartments/manage'))return reply({items:[],has_more:false});
  return reply({unread_count:0});
 });
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space?view=overview`);
 await expect(page.locator('.space-overview-slogan')).toHaveText('Misala na yo nyonso, na esika moko!');
 const cards=page.locator('.overview-card');
 await expect(cards).toHaveCount(2);
 await expect(cards.filter({hasText:'Actual shop'})).toHaveAttribute('href',/store=WNZ_shop/);
 const profile=cards.filter({hasText:'Shared professional identity'});
 await expect(profile).toContainText(overviewCopy[locale].profile[0]);
 await expect(profile).toHaveAttribute('href',/provider=PRO_one/);
 await expect(page.locator('.overview-welcome')).toHaveCount(0);
 await expect(page.locator('.space-sidebar a[aria-current="page"]')).toHaveAttribute('href',/view=overview/);
 await page.locator('.activity-overview header button').click();
 const property=page.locator('#overview-create a').filter({has:page.locator('svg path[d^="m3 10"]')});
 await expect(property).toHaveAttribute('href',/\/shida\/appartements\/publier\//);
 await expect(page.locator('#overview-create a[href*="business.nihiloba.com"]')).toHaveCount(0);
 const commands=await page.locator('#overview-create a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')||''));
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
  if(path.endsWith('/security/navigation'))return reply({markets:['wenze','services','apartments','jobs','hotels','wewa'],travel_profiles:[{kind:'hotel',reference:'a'.repeat(64),name:'Hotel Test'},{kind:'driver',reference:'b'.repeat(64),name:'Test Transport'}],organization_management:false,activity_counts:{wenze:2,listings:3,services:1,restaurants:0,apartments:4,jobs:2,hotels:1,wewa:1}});
  if(path.endsWith('/wenze/stores'))return reply({stores:[]});
  if(path.endsWith('/restaurants'))return reply({items:[],total:0,actions:['create']});
  if(path.endsWith('/services'))return reply({profiles:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  if(path.endsWith('/job-offer'))return reply({rows:[{type:'job',reference:'JOB_exact',title:'Actual offer',status:'open'}]});
  if(path.endsWith('/apartments/manage'))return reply({items:[{reference:'APT_exact',name:'Appartement'}],has_more:false});
  return reply({unread_count:0});
 });
 await page.goto('/shida/space?view=overview');
 const cards=page.locator('.overview-card');
 await expect(cards).toHaveCount(4);
 await expect(cards.filter({hasText:'Actual offer'})).toHaveAttribute('href',/offer=JOB_exact/);
 await expect(cards.filter({hasText:'Appartement'})).toHaveAttribute('href',/property=APT_exact/);
 await expect(cards.filter({hasText:'Hotel Test'})).toHaveAttribute('href',/hotel\+a{64}\+en/);
 await expect(cards.filter({hasText:'Test Transport'})).toHaveAttribute('href',/driver\+b{64}\+en/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);

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
  if(path.endsWith('/job-offer'))return reply({rows:drafts?[{type:'article',reference:'WQD_draft',title:'Brouillon',status:'draft'}]:[]});
  if(path.endsWith('/apartments/manage'))return reply({items:[],has_more:false});
  return reply({unread_count:0});
 });
 await page.goto('/fr/shida/space?view=overview');
 await expect(page.locator('.overview-card')).toHaveCount(drafts);
 await expect(page.locator('.overview-card[href*="item=WQD_draft"]')).toHaveCount(drafts);
 await expect(page.locator('.overview-welcome')).toHaveCount(drafts?0:1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/empty-activity-${drafts}-${width}.png`,fullPage:true});
});
