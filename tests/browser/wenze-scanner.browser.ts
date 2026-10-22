import {test,expect,type Page} from '@playwright/test';
import {checkoutText as copy} from '../../app/lib/wenze-checkout-copy';
import labels from '../fixtures/wenze-scan-labels.json' with {type:'json'};
import {cameraCopy} from '../../app/lib/wenze-camera-copy';
import {posText} from '../../app/lib/wenze-pos-copy';
const business=false;
type Locale='en'|'fr'|'ln'|'sw';
async function fixture(page:Page,{online=false,retry=false,locale='fr' as Locale}={}){
 const shop={public_ref:'WNZ_fixture',name:'Boutique du Fleuve',store_type:online?'online_only':'online_and_physical',city:'Kinshasa',category:'fashion_clothing',revision:1,status:'active',visible:'true',catalog_ready:true,order_ready:true};
 const items=[{product_ref:'WNP_shirt',variant_ref:'WNV_medium',barcode:'WNV_medium',name:'Chemise blanche',variant:'Blanc / M',price:'15000',currency:'CDF',available:3,image_url:'/images/wenze-boutique-market.webp',category:'fashion_clothing'},{product_ref:'WNP_shirt',variant_ref:'WNV_large',barcode:'WNV_large',name:'Chemise blanche',variant:'Blanc / L',price:'15000',currency:'CDF',available:3,image_url:null,category:'fashion_clothing'},{product_ref:'WNP_phone',variant_ref:null,barcode:'WNP_phone',name:'Téléphone 128 Go',variant:null,price:'350000',currency:'CDF',available:5,image_url:null,category:'phones_electronics'},{product_ref:'WNP_soap',variant_ref:null,barcode:'WNP_soap',name:'Savon doux',variant:null,price:'5.50',currency:'USD',available:8,image_url:null,category:'other'}];
 const receipt={store_ref:shop.public_ref,receipt_ref:'WRC_fixture',shop_name:shop.name,city:'Kinshasa',source:'basket',sold_at:'2026-10-21T12:30:00Z',payment:'seller_recorded_cash',has_reversals:false,totals:[{currency:'CDF',amount:'30000'}],lines:[{name:'Chemise blanche · Blanc / M',quantity:2,unit_price:'15000',total:'30000',currency:'CDF',reversed:false}],payment_details:{received:{CDF:'50000.00'},change:{CDF:'20000.00'}}};
 const writes:{key:string;body:Record<string,unknown>}[]=[];const errors:string[]=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER ERROR:',e.message);});
 await page.addInitScript(l=>localStorage.setItem('shida-wenze-language',l),locale);
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Demo seller'}});
  if(path.endsWith('/me'))return reply({user:{account_type:'both',display_name:'Demo seller'},businesses:[]});
  if(path.endsWith('/contexts'))return reply({contexts:[{type:'organization',public_ref:'BUS_fixture',name:shop.name,role:'owner',restricted:false,onboarding_status:'complete',operational_state:'operational'}]});
  if(path.endsWith('/stores'))return reply({stores:[shop],categories:['fashion_clothing','phones_electronics','other'].map((code,i)=>({code,labels:{en:['Clothing','Electronics','Other'][i],fr:['Vêtements','Électronique','Autres'][i],ln:code,sw:code}})),currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_fixture'))return reply(shop);
  if(path.endsWith('/products'))return reply({products:[],total:0});
  if(path.endsWith('/plan'))return reply({plan:'pro',source:'personal_pilot'});
  if(path.endsWith('/today'))return reply({date:'2026-10-21',timezone:'Africa/Kinshasa',followers:0,new_followers:0,orders_today:0,reviews:{count:0},financial_access:true,currency_summaries:[],sold_items:[]});
  if(path.endsWith('/catalog-imports/options'))return reply({stores:[shop],categories:[],currencies:['CDF','USD'],issues:{},support_url:null});
  if(path.endsWith('/orders'))return reply({orders:[],stores:[shop],counts:{},total:0});
  if(path.endsWith('/inventory/summary'))return reply({low_stock_items:0,untracked_items:0});
  if(path.endsWith('/inventory/stock'))return reply({items:[]});
  if(path.endsWith('/physical-sales/priced'))return reply({sales:[]});
  if(path.endsWith('/pos/catalog')){const category=url.searchParams.get('category'),found=items.filter(i=>!category||i.category===category);return reply({items:found,categories:['fashion_clothing','phones_electronics','other'],total:new Set(found.map(i=>i.product_ref)).size});}
  if(path.includes('/pos/lookup/'))return reply(items.find(i=>path.endsWith(i.barcode)));
  if(path.endsWith('/pos/checkout')){writes.push({key:req.headers()['idempotency-key'],body:req.postDataJSON()});return retry&&writes.length===1?reply({detail:'temporarily unavailable'},503):reply({...receipt,payment:req.postDataJSON().payment});}
  if(path.endsWith('/pos/receipts/WRC_fixture'))return reply(receipt);
  if(path.endsWith('/pos/receipts'))return reply({receipts:[receipt],total:1});
  if(path.endsWith('/pdf'))return route.fulfill({body:'%PDF-1.4\nfixture',contentType:'application/pdf',headers:{'Content-Disposition':'attachment; filename="receipt.pdf"'}});
  return reply({});
 });
 const url=business?'/wenze?context=BUS_fixture&store=WNZ_fixture':`${locale==='en'?'':'/'+locale}/shida/seller/wenze/?store=WNZ_fixture`;
 return {writes,errors,url};
}

async function camera(page:Page,code:'WNP_phone'|'WNV_medium',native=false){
 await page.addInitScript(({label,code,native})=>{
  const state={stopped:0,requests:0};Object.assign(window,{scanState:state});
  Object.defineProperty(window,'BarcodeDetector',{configurable:true,value:native?class{static async getSupportedFormats(){return ['code_128'];}async detect(){return [{rawValue:code},{rawValue:code}];}}:undefined});
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{
   state.requests++;const canvas=document.createElement('canvas');canvas.width=label.width*3;canvas.height=360;const context=canvas.getContext('2d')!;
   const draw=()=>{context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle='black';for(const [x,w] of label.bars)context.fillRect(x*3,30,w*3,300);};
   draw();const stream=canvas.captureStream(10),timer=setInterval(draw,100);for(const track of stream.getTracks()){const original=track.stop.bind(track);track.stop=()=>{state.stopped++;clearInterval(timer);original();};}return stream;
  }});
 },{label:labels[code],code,native});
}
for(const code of ['WNP_phone','WNV_medium'] as const)test(`fallback decodes actual SHIDA label ${code}`,async({page})=>{
 const locale='fr';await page.setViewportSize({width:390,height:900});const {url,errors}=await fixture(page,{locale});await camera(page,code);
 let lookups=0;page.on('request',request=>{if(request.url().includes('/pos/lookup/'))lookups++;});
 await page.goto(url+"&view=sales");await page.getByRole('button',{name:posText(locale,'camera'),exact:true}).click();
 await expect.poll(()=>lookups).toBe(1);await expect(page.locator('.wz-camera')).toBeHidden();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {scanState:{stopped:number}}).scanState.stopped)).toBeGreaterThan(0);
 expect(errors).toEqual([]);
});
test('native repeated detection adds one item and releases the camera',async({page})=>{
 const {url}=await fixture(page);await camera(page,'WNP_phone',true);let lookups=0;page.on('request',r=>{if(r.url().includes('/pos/lookup/'))lookups++;});await page.goto(url+"&view=sales");await page.getByRole('button',{name:posText('fr','camera'),exact:true}).click();await expect.poll(()=>lookups).toBe(1);await expect(page.locator('.wz-camera')).toBeHidden();
});
test('camera denial retains manual entry and clear localized guidance',async({page})=>{
 const {url}=await fixture(page);await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{throw new DOMException('Denied','NotAllowedError');}});});await page.goto(url+"&view=sales");await page.getByRole('button',{name:posText('fr','camera'),exact:true}).click();await expect(page.getByText(cameraCopy.fr.denied,{exact:true})).toBeVisible();await expect(page.locator('.wz-checkout-search input')).toBeEnabled();
});
