import {test,expect,type Page} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';
import {refinementCopy} from '../../app/lib/restaurant-refinement-copy';
import {operationsCopy} from '../../app/lib/restaurant-operations-copy';
import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
import {restaurantReviewCopy} from '../../app/lib/restaurant-review-copy';
import {restaurantText} from '../../app/lib/restaurant-seller-copy';
import {managementCopy} from '../../app/lib/restaurant-management-copy';
import {soloCopy} from '../../app/lib/restaurant-solo-copy';
import {settingsCopy} from '../../app/lib/restaurant-settings-copy';
import {mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const evidence=process.env.RESTAURANT_EVIDENCE_DIR??join(tmpdir(),`shida-restaurant-evidence-${Date.now()}`);mkdirSync(evidence,{recursive:true});
const revision='2026-11-15T08:00:00Z';
async function seed(page:Page){
 const state={stock:0,stockError:false,stockDelay:0,reviewError:false,reviews:0,empty:true,hoursKnown:true,qrEnabled:true,failSave:false,writes:[] as {path:string;body:{fields?:{confirm?:boolean;closures?:unknown;windows?:unknown[]}}}[]};
 const restaurant={public_ref:'RST_refine',revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:'Restaurant SHIDA Test',description:'Cuisine congolaise : pondu, fumbwa et poisson braisé.',food_business_type:'malewa',city:'Kinshasa',commune:'Lemba',quartier:'Gombele',public_address:'Adresse privée de test',address_visibility:'broad',timezone_name:'Africa/Kinshasa',service_modes:'eat_there,takeaway',establishment_photo_url:null,logo_url:'https://example.invalid/private-logo'}};
 let windows=[{weekday:0,start:'11:00',end:'14:00'},{weekday:0,start:'18:00',end:'22:00'},{weekday:5,start:'12:30',end:'01:00'}];
 const hours=()=>({revision,result:{timezone_name:'Africa/Kinshasa',status:state.hoursKnown?'open':'unknown',confirmed_at:state.hoursKnown?revision:null,schedule:state.hoursKnown?{windows}:null,exceptional_closures:[{starts_at:'2026-12-20T10:00:00+01:00',ends_at:'2026-12-20T14:00:00+01:00',timezone_name:'Africa/Kinshasa',confirmed_at:revision}]}});
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://localhost:3013'?route.continue():route.abort());
 await page.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url()),p=url.pathname.replace(/\/$/,'');const send=(json:unknown,status=200)=>route.fulfill({json,status});
 if(p.endsWith('/employment/session'))return send({user:{display_name:'Fixture'},binding:'a'.repeat(64)});
 if(p.endsWith('/capabilities'))return send({capabilities:['restaurant.pos','restaurant.inventory','restaurant.reservations'].map(capability=>({capability,available:true}))});
 if(p.endsWith('/restaurants'))return send({items:[restaurant],total:1,page:1,page_size:20,actions:['create']});
 if(p.endsWith('/RST_refine'))return send(restaurant);
 if(p.endsWith('/preview'))return send({...restaurant,preview:{name:restaurant.profile.name,description:restaurant.profile.description,location:'Lemba, Kinshasa'}});
 if(p.endsWith('/menu-preview'))return send({items:[],total:0,page:1,page_size:5});
 if(p.endsWith('/hours')){if(req.method()==='PUT'){const body=req.postDataJSON();state.writes.push({path:p,body});if(state.failSave)return send({},503);if(body.fields.windows)windows=body.fields.windows;}return send(hours());}
 if(p.includes('/links/')){const destination=p.split('/').at(-1);state.writes.push({path:p,body:{}});return send({establishment_ref:restaurant.public_ref,destination,public_url:`https://nihiloba.com/go/TEST_${destination}`,qr_content:`https://nihiloba.com/go/TEST_${destination}`});}
 if(p.endsWith('/reviews'))return send(state.reviewError?{}:{items:state.reviews?[{review_ref:'RVW_test',rating:4,comment:'Très bon repas',seller_response:null,revision:1,verified_experience:true,created_at:revision}]:[],total:state.reviews,average:state.reviews?4.3:null},state.reviewError?503:200);
 if(p.endsWith('/inventory')){if(state.stockDelay)await new Promise(resolve=>setTimeout(resolve,state.stockDelay));return send(state.stockError?{}:{items:state.stock?[{item_ref:'INV_test',name:'Eau',low_stock:true}]:[],total:state.stock},state.stockError?503:200);}
 if(p.endsWith('/orders')){const status=url.searchParams.getAll('states')[0];return send({items:!state.empty&&status==='ready'?[{order_ref:'ROD_test',state:'ready',submitted_at:revision,fulfillment_method:'pickup'}]:[],total:status==='accepted'?2:!state.empty&&status==='ready'?1:0});}
 if(p.endsWith('/reservations/pending')||p.endsWith('/reservations/calendar'))return send({items:[],has_more:false});
 if(p.endsWith('/service/groups'))return send({},503);
 if(p.endsWith('/daily/summary'))return send({as_of:revision,time_zone:'Africa/Kinshasa',currencies:{CDF:{recorded_net:'185000.00',balance_due:'17000.00'},USD:{recorded_net:'25.00',balance_due:'0.00'}}});
 if(p.endsWith('/service/payment-methods'))return send({items:[]});
 if(p.endsWith('/reservations/setting'))return send({enabled:true,available:false,revision:1});
 if(p.endsWith('/guest-auto-accept'))return send({enabled:false,revision:1});
 if(p.endsWith('/order-configuration'))return send({revision,intake_released:true,pickup:{enabled:state.qrEnabled,windows:[]},schedules:{pickup:{weekly_periods:windows,minimum_lead_minutes:0,cutoff_minutes:0,allow_tomorrow:false},delivery:null},delivery:{enabled:false,windows:[],areas:[],fee:{amount:'',currency:'CDF'}},guest_auto_accept:{enabled:false,revision:1}});
 return send({},404);
 });return state;
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,820,1440])test(`remaining pages ${locale} ${width}`,async({page})=>{
 await seed(page);await page.setViewportSize({width,height:1000});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/`);const c=refinementCopy[locale],op=operationsCopy[locale];
 const today=page.locator('.rst-today');await expect(today.getByText(op.empty,{exact:true})).toBeVisible();await today.getByText(op.about,{exact:true}).click();await expect(today.getByText(op.coverage,{exact:true})).toBeVisible();
 await today.getByText(op.about,{exact:true}).click();await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();});await page.addStyleTag({content:'nextjs-portal{display:none}'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr')await page.screenshot({path:`${evidence}/today-${width}.png`,fullPage:true});
 await managementNavigation(page,sellerDesignCopy[locale].profile);await expect(page.locator('.rst-profile-overview')).toBeVisible();await expect(page.getByText('https://example.invalid/private-logo',{exact:true})).toHaveCount(0);
 if(locale==='fr')await page.screenshot({path:`${evidence}/profile-${width}.png`,fullPage:true});
 await managementNavigation(page,restaurantReviewCopy[locale].reviews);await expect(page.getByRole('heading',{name:c.emptyReviews,exact:true})).toBeVisible();await expect(page.getByText('0 / 5')).toHaveCount(0);
 if(locale==='fr')await page.screenshot({path:`${evidence}/reviews-${width}.png`,fullPage:true});
 await managementNavigation(page,managementCopy[locale].settings);await expect(page.getByRole('heading',{name:c.seated,exact:true})).toBeVisible();if(locale==='fr')await page.screenshot({path:`${evidence}/settings-${width}.png`,fullPage:true});
 await managementNavigation(page,sellerDesignCopy[locale].sharing);await expect(page.locator('.rst-share-panel canvas')).toBeVisible();await expect(page.getByRole('button',{name:c.download,exact:true})).toBeEnabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr')await page.screenshot({path:`${evidence}/sharing-${width}.png`,fullPage:true});
 await managementNavigation(page,sellerDesignCopy[locale].hours);await page.locator('.rst-card').getByRole('button',{name:restaurantText(locale,'edit'),exact:true}).click();await expect(page.locator('.rst-week-day')).toHaveCount(7);await expect(page.getByText(c.nextDay,{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(locale==='fr')await page.screenshot({path:`${evidence}/hours-${width}.png`,fullPage:true});
});

test('settings distinguish saved availability and review QR consequences before any write',async({page})=>{
 const state=await seed(page);state.qrEnabled=false;await page.goto('/fr/shida/seller/restaurants/');await managementNavigation(page,managementCopy.fr.settings);
 const reservation=page.locator('.rst-settings-reservation'),c=settingsCopy.fr;
 await expect(reservation).toContainText(`${c.saved}: ${c.on}`);await expect(reservation).toContainText(`${c.available}: ${c.off}`);
 const qr=page.locator('.rst-quick-qr');await qr.getByRole('button',{name:refinementCopy.fr.configure,exact:true}).click();await qr.getByRole('button',{name:soloCopy.fr.enableQr,exact:true}).click();await expect(qr.getByText(soloCopy.fr.qrEffect,{exact:true})).toBeVisible();expect(state.writes).toHaveLength(0);
 await page.evaluate(()=>window.dispatchEvent(new Event('offline')));await expect(reservation).toContainText(`${c.saved}: ${c.unknown}`);await expect(qr.getByRole('button',{name:'Confirmer',exact:true})).toBeDisabled();expect(state.writes).toHaveLength(0);
});
test('truthful failures, stock states, review pagination and QR output',async({page})=>{
 const state=await seed(page);await page.goto('/fr/shida/seller/restaurants/');const today=page.locator('.rst-today');await expect(today.getByText(operationsCopy.fr.empty,{exact:true})).toBeVisible();state.stock=3;state.empty=false;await today.getByRole('button',{name:'Actualiser',exact:true}).click();await expect(today.locator('.rst-metric-stock-attention strong')).toHaveText('3');await expect(today.locator('.rst-ops-work')).toHaveCount(1);state.stockError=true;await today.getByRole('button',{name:'Actualiser',exact:true}).click();await expect(today.locator('.rst-metric-stock strong')).toHaveText('—');state.stockError=false;state.stock=0;state.stockDelay=800;await today.locator('.rst-metric-stock').getByRole('button',{name:'Réessayer'}).click();await expect(today.locator('.rst-metric-stock')).toBeVisible();await expect(today.locator('.rst-metric-stock strong')).toHaveText('0');
 state.reviewError=true;await managementNavigation(page,'Avis clients');await expect(page.locator('.rst-reviews').getByRole('alert')).toBeVisible();await expect(page.getByRole('heading',{name:'Pas encore d’avis'})).toHaveCount(0);state.reviewError=false;state.reviews=24;await page.locator('.rst-reviews').getByRole('button',{name:'Réessayer'}).click();await expect(page.locator('.rst-reviews')).toContainText('4,3 / 5');await page.locator('.rst-reviews').getByRole('button',{name:'Suivant',exact:true}).click();await expect(page.locator('.rst-reviews')).toContainText('24');
 await managementNavigation(page,'Partager mon restaurant');await expect(page.getByRole('button',{name:'Télécharger le QR'})).toBeEnabled();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le QR'}).click();expect((await download).suggestedFilename()).toBe('SHIDA-menu-QR.png');
 await page.context().grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'Copier le lien',exact:true}).click();await expect(page.getByText('Lien copié',{exact:true})).toBeVisible();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('https://nihiloba.com/go/TEST_menu');
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:()=>Promise.reject(new DOMException('cancelled','AbortError'))}));await page.getByRole('button',{name:'Partager',exact:true}).click();await expect(page.locator('.rst-share-panel').getByText(refinementCopy.fr.failure)).toHaveCount(0);
 const printWindow=page.waitForEvent('popup');await page.getByRole('button',{name:'Imprimer',exact:true}).click();const printed=await printWindow;await expect(printed.getByRole('heading',{name:'Menu sur WhatsApp'})).toBeVisible();await expect(printed.locator('nav,aside')).toHaveCount(0);await printed.close();
 const pixels=await page.locator('.rst-share-panel canvas').evaluate((canvas:HTMLCanvasElement)=>({data:Array.from(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data),width:canvas.width,height:canvas.height}));
 const {RGBLuminanceSource,BinaryBitmap,HybridBinarizer,QRCodeReader}=await import('@zxing/library');const rgba=pixels.data;const rgb=Int32Array.from({length:pixels.width*pixels.height},(_,i)=>(rgba[i*4]<<16)|(rgba[i*4+1]<<8)|rgba[i*4+2]);expect(new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(rgb,pixels.width,pixels.height)))).getText()).toBe('https://nihiloba.com/go/TEST_menu');
 await page.getByRole('button',{name:'Restaurant sur WhatsApp',exact:true}).click();await expect(page.getByRole('link',{name:'Tester le lien'})).toHaveAttribute('href','https://nihiloba.com/go/TEST_restaurant');expect(state.writes.every(write=>write.path.includes('/links/'))).toBe(true);
});
test('hours copying, unknown state, overnight overlap and failed save retain edits',async({page})=>{
 const state=await seed(page);state.hoursKnown=false;await page.goto('/fr/shida/seller/restaurants/');await managementNavigation(page,sellerDesignCopy.fr.hours);await page.locator('.rst-card').getByRole('button',{name:restaurantText('fr','edit'),exact:true}).click();await expect(page.getByText(refinementCopy.fr.unknown,{exact:true})).toBeVisible();await expect(page.locator('.rst-week-day')).toHaveCount(0);await page.getByLabel('Horaires connus',{exact:true}).check();await expect(page.locator('.rst-week-day')).toHaveCount(7);
 const monday=page.getByRole('group',{name:'lundi',exact:true});await monday.getByRole('checkbox').check();await monday.getByLabel('Début',{exact:true}).fill('11:00');await monday.getByLabel('Fin',{exact:true}).fill('14:00');await monday.getByRole('button',{name:/Ajouter un autre/}).click();await monday.getByLabel('Début',{exact:true}).nth(1).fill('18:00');await monday.getByLabel('Fin',{exact:true}).nth(1).fill('22:00');
 await page.getByRole('button',{name:'Copier des horaires',exact:true}).click();await page.locator('.rst-week-targets').getByLabel('mardi',{exact:true}).check();await page.getByRole('button',{name:'Remplacer ces horaires',exact:true}).click();const tuesday=page.getByRole('group',{name:'mardi',exact:true});await expect(tuesday.getByLabel('Début',{exact:true})).toHaveCount(2);await expect(tuesday.getByLabel('Début',{exact:true}).nth(1)).toHaveValue('18:00');
 const sunday=page.getByRole('group',{name:'dimanche',exact:true});await sunday.getByRole('checkbox').check();await sunday.getByLabel('Début',{exact:true}).fill('22:00');await sunday.getByLabel('Fin',{exact:true}).fill('12:00');await expect(page.getByText(refinementCopy.fr.overlap,{exact:true})).toBeVisible();await sunday.getByLabel('Fin',{exact:true}).fill('01:00');await expect(page.getByText(refinementCopy.fr.overlap,{exact:true})).toHaveCount(0);
 await page.evaluate(()=>{HTMLElement.prototype.requestFullscreen=()=>Promise.reject(new Error('fixture'));});await page.locator('.rst-focus-toolbar').getByRole('button',{name:'Plein écran',exact:true}).filter({visible:true}).click();await page.keyboard.press('Escape');await expect(tuesday.getByLabel('Début',{exact:true}).nth(1)).toHaveValue('18:00');
 state.failSave=true;await page.getByRole('button',{name:'Enregistrer les modifications',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmer le changement',exact:true}).click();await expect.poll(()=>state.writes.filter(w=>w.path.endsWith('/hours')).length).toBe(1);await expect(tuesday.getByLabel('Début',{exact:true}).nth(1)).toHaveValue('18:00');const write=state.writes.find(w=>w.path.endsWith('/hours'))!;expect(write.body.fields?.confirm).toBe(true);expect(write.body.fields?.closures).toBeUndefined();expect(write.body.fields?.windows).toHaveLength(5);
});
