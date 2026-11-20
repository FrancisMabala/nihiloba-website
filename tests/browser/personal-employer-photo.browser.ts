import {test,expect,type Page,type Route} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {personalEmployerPhotoCopy as copy} from '../../app/lib/personal-employer-photo-copy';
const photo=readFileSync('public/shida-service-categories.jpeg'); // Existing non-personal JPEG fixture.
const offer='JOB_photo_fixture',policy='public-personal-employer-photo-v1';
async function fixture(page:Page,options:{holdPreview?:boolean;holdUpload?:boolean}={}){
 let binding='a'.repeat(64),version='a'.repeat(64),saved=options.holdPreview,uploads=0,removals=0;const writes:{method:string;query:Record<string,string>;body:unknown}[]=[];
 let held:Route|undefined;
 const state=(owner=binding)=>({offer_ref:offer,version:owner==='b'.repeat(64)?'d'.repeat(64):version,policy,photo:owner==='a'.repeat(64)&&saved?{asset_ref:'AST_fixture',url:'https://private-provider.invalid/never-fetch'}:null});
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding,user:{display_name:binding.startsWith('a')?'Test account A':'Test account B'}});
  if(path.endsWith('/personal/job-offer'))return reply(url.searchParams.get('kind')==='manage'?{type:'job',reference:offer,status:'open',title:'Synthetic personal job',count:0,version:'job-v1',values:{short_summary:'Synthetic task'},allowed_actions:['edit','pause','close','remove']}:{records:[]});
  if(path.endsWith('/personal/employer-photo')){
   if(request.method()==='GET'){
    if(url.searchParams.has('asset_ref')){if(options.holdPreview){held=route;return;}return route.fulfill({body:photo,contentType:'image/jpeg'});}
    return reply(state(request.headers()['x-shida-session']));
   }
   writes.push({method:request.method(),query:Object.fromEntries(url.searchParams),body:request.method()==='DELETE'?request.postDataJSON():null});
   if(request.method()==='POST'){
    if(options.holdUpload){held=route;return;}
    if(++uploads===1)return reply({},503);saved=true;version='b'.repeat(64);return reply(state());
   }
   if(++removals===1){version='c'.repeat(64);return reply({},409);}saved=false;version='d'.repeat(64);return reply(state());
  }
  return reply({},404);
 });
 return {writes,held:()=>Boolean(held),switchAccount:async()=>{binding='b'.repeat(64);await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));},release:async()=>{await held?.fulfill(options.holdPreview?{body:photo,contentType:'image/jpeg'}:{json:{offer_ref:offer,version:'b'.repeat(64),policy,photo:{asset_ref:'AST_old_account',url:'/api/assets/AST_old_account'}}}).catch(()=>{});}};
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,1440])test(`optional individual poster photo consent retry removal ${locale} ${width}`,async({page},info)=>{
 const f=await fixture(page),t=copy[locale];await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space?view=listings&kind=manage&offer=${offer}#personal-employer-photo`);
 const editor=page.locator('#personal-employer-photo'),upload=editor.locator('input[type=file]'),consent=editor.getByRole('checkbox',{name:t.consent,exact:true}),publish=editor.getByRole('button',{name:t.publish,exact:true});
 await expect(editor).toContainText(t.none);await expect(consent).not.toBeChecked();await expect(publish).toBeDisabled();
 await upload.setInputFiles({name:'poster.jpeg',mimeType:'image/jpeg',buffer:photo});await expect(consent).not.toBeChecked();await expect(publish).toBeDisabled();expect(f.writes).toHaveLength(0);
 await expect(editor.getByRole('img',{name:t.selected,exact:true})).toBeVisible();await consent.check();await publish.click();await expect(editor.getByRole('alert')).toContainText(t.error);await expect(consent).toBeChecked();
 await publish.click();await expect(editor).toContainText(t.saved);await expect(consent).not.toBeChecked();const current=editor.getByRole('img',{name:t.current,exact:true});await expect(current).toBeVisible();await expect.poll(()=>current.evaluate(image=>(image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);await expect(current).toHaveAttribute('src',/^blob:/);
 expect(f.writes[0].query).toMatchObject({offer_ref:offer,version:'a'.repeat(64),policy,public_consent:'true'});expect(f.writes[1].query.version).toBe('a'.repeat(64));
 await editor.getByRole('button',{name:t.remove,exact:true}).click();await expect(editor.getByRole('alert')).toContainText(t.stale);await expect(publish).toBeDisabled();await editor.getByRole('button',{name:t.reload,exact:true}).click();await expect(editor.getByRole('button',{name:t.remove,exact:true})).toBeEnabled();await editor.getByRole('button',{name:t.remove,exact:true}).click();await expect(editor).toContainText(t.removed);await expect(editor.getByRole('img',{name:t.current,exact:true})).toHaveCount(0);
 expect(f.writes.at(-1)?.body).toEqual({offer_ref:offer,version:'c'.repeat(64)});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 for(const button of await editor.getByRole('button').all()){const box=await button.boundingBox();if(box)expect(box.height).toBeGreaterThanOrEqual(44);}
 await page.screenshot({path:info.outputPath('photo-editor-'+locale+'-'+width+'.png'),fullPage:true});
 await editor.getByRole('button',{name:t.skip,exact:true}).click();await expect(editor.getByRole('button',{name:t.open,exact:true})).toBeVisible();
});
test('late owner preview cannot appear after switching Personal accounts',async({page})=>{
 const f=await fixture(page,{holdPreview:true});await page.goto(`/shida/space?view=listings&kind=manage&offer=${offer}`);await expect.poll(f.held).toBe(true);await f.switchAccount();const editor=page.locator('#personal-employer-photo');await expect(editor).toContainText(copy.en.none);await f.release();await expect(editor.locator('img')).toHaveCount(0);expect(f.writes).toHaveLength(0);
});
test('late upload cannot overwrite the editor after switching Personal accounts',async({page})=>{
 const f=await fixture(page,{holdUpload:true});await page.goto(`/shida/space?view=listings&kind=manage&offer=${offer}`);const editor=page.locator('#personal-employer-photo');await editor.locator('input[type=file]').setInputFiles({name:'poster.jpeg',mimeType:'image/jpeg',buffer:photo});await editor.getByRole('checkbox',{name:copy.en.consent}).check();await editor.getByRole('button',{name:copy.en.publish}).click();await expect.poll(f.held).toBe(true);await f.switchAccount();await expect(editor).toContainText(copy.en.none);await f.release();await expect(editor.locator('img')).toHaveCount(0);await expect(editor.getByRole('checkbox',{name:copy.en.consent})).not.toBeChecked();
});
