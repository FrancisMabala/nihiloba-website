import {test,expect,type Page} from '@playwright/test';
import {customerReceiptCopy} from '../../app/lib/customer-receipt-copy';
const reference='CRG_'+'a'.repeat(32),version='b'.repeat(64);
async function fixture(page:Page,{status='pending',changed=false}:{status?:string;changed?:boolean}={}){
 const writes:{path:string;body:unknown}[]=[];let state=status;
 const item=()=>({request_ref:reference,source:'wenze',merchant_ref:'WNZ_fixture',receipt_ref:'WRC_fixture',receipt_version:version,status:state,revision:1,created_at:'2026-11-20T12:00:00Z',expires_at:'2026-11-21T12:00:00Z'});
 await page.route('**/api/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test customer'}});
  if(path.endsWith('/customer/id'))return reply({number:null,display_number:null,qr_value:null});
  if(path.endsWith('/customer/receipts'))return reply({items:[item()],has_more:false});
  if(path.includes('/customer/receipts/'+reference)){
   if(request.method()==='POST'){writes.push({path,body:request.postDataJSON()});state=path.endsWith('/accept')?'accepted':path.endsWith('/reject')?'rejected':'revoked';return reply(item());}
   return reply({...item(),changed,receipt:{shop_name:'Test shop',receipt_ref:'WRC_fixture',sold_at:'2026-11-20T12:00:00Z',tax_invoice:false,document_verifies_payment:false,has_reversals:changed,lines:[{name:'Rice',quantity:2,total:'4000',currency:'CDF',reversed:changed}],totals:[{currency:'CDF',amount:'4000'}]}});
  }
  if(path.endsWith('/personal/candidate'))return reply({profiles:[]});
  if(path.endsWith('/security/navigation'))return reply({markets:[],organization_management:false,travel_profiles:[],activity_counts:{}});
  if(path.endsWith('/wenze/stores'))return reply({stores:[]});
  if(path.endsWith('/restaurants'))return reply({items:[],total:0});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:[]});
  if(path.endsWith('/services'))return reply({profiles:[]});
  return reply({},404);
 });return writes;
}
for(const locale of ['fr','en','ln','sw'] as const)test(`receipt approval after full review ${locale} phone`,async({page},info)=>{
 const writes=await fixture(page),c=customerReceiptCopy[locale];await page.setViewportSize({width:390,height:844});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/space/?view=profiles`);const area=page.locator('.customer-receipts');await area.getByRole('button',{name:c.review,exact:true}).click();await expect(area).toContainText('Test shop');await expect(area).toContainText('Rice');await expect(area).toContainText('CDF');await expect(area.getByRole('button',{name:c.accept,exact:true})).toBeDisabled();await area.getByRole('checkbox').check();await area.getByRole('button',{name:c.accept,exact:true}).click();await expect(area).toContainText(c.accepted);expect(writes).toEqual([{path:'/api/shida/personal/customer/receipts/'+reference+'/accept',body:{expected_revision:1,receipt_version:version}}]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:info.outputPath('receipt-consent-'+locale+'.png'),fullPage:true});
});
test('pending changed receipt cannot be accepted; accepted changed receipt shows updates and revocation',async({page})=>{
 const writes=await fixture(page,{changed:true}),c=customerReceiptCopy.en;await page.goto('/shida/space/?view=profiles');const area=page.locator('.customer-receipts');await area.getByRole('button',{name:c.review}).click();await expect(area).toContainText(c.changed);await expect(area.getByRole('button',{name:c.accept,exact:true})).toBeDisabled();expect(writes).toEqual([]);
 await page.unroute('**/api/**');const accepted=await fixture(page,{changed:true,status:'accepted'});await page.reload();await area.getByRole('button',{name:c.review}).click();await expect(area).toContainText(c.updated);await expect(area).toContainText(c.reversed);await expect(area.getByRole('checkbox')).toHaveCount(0);await area.getByRole('button',{name:c.revoke}).click();await expect(area).toContainText(c.revoked);expect(accepted[0].path).toContain('/revoke');
});
