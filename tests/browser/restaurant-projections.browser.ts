import {test,expect} from '@playwright/test';
import {fixture,open} from './restaurant-c1e-fixture';
test('private preview paginates plain text, clears offline and rejects lost ownership',async({page,context})=>{
 await fixture(page);let denied=false;
 await page.route('**/RST_fixture/menu-preview/**',route=>{
  if(denied)return route.fulfill({status:404,json:{detail:'restaurant_unavailable'}});
  const q=new URL(route.request().url()).searchParams;expect(q.get('page_size')).toBe('5');
  const n=Number(q.get('page'));const items=Array.from({length:n===1?5:1},(_,i)=>({name:`Food ${i}`,category_name:'Food',text:n===1?`<b>Food ${i}</b>\n1000 CDF`:'Last food\nSold out'}));
  return route.fulfill({json:{items,count:items.length,total:6,page:n,page_size:5,preview:true}});
 });
 await open(page);await page.getByRole('button',{name:'Public preview',exact:true}).first().click();const preview=page.locator('.rst-menu-preview');
 await expect(preview.getByText('<b>Food 0</b>\n1000 CDF')).toBeVisible();await expect(preview.locator('b')).toHaveCount(0);
 await preview.getByRole('button',{name:'Next',exact:true}).click();await expect(preview.getByText(/Last food/)).toBeVisible();await expect(preview.getByRole('button',{name:'Next',exact:true})).toBeDisabled();
 await context.setOffline(true);await expect(preview.getByText(/Last food/)).toHaveCount(0);await context.setOffline(false);await expect(preview.getByText(/Last food/)).toBeVisible();
 denied=true;await preview.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.locator('.rst-menu-preview')).toHaveCount(0);
});
test('bounded standalone and plate rows, truthful omissions, pending deadline and full-row changes',async({page})=>{
 await fixture(page);let changed=false,details=0;
 const summary={available:true,groups:[{kind:'standalone',plate_number:null,lines:[{name:'Rice',quantity:2,sale_unit_label:'bowl',currency:'CDF'}],remaining_lines:0},{kind:'plate',plate_number:1,lines:[{name:'Pondu',selected_amount:'1000.00',currency:'CDF'}],remaining_lines:2}],total_groups:3,total_lines:6,remaining_groups:1,remaining_lines:4,truncated:true};
 const row=()=>({order_ref:'ROR_projection',state:changed?'accepted':'pending',revision:changed?2:1,entry_source:'customer',fulfillment_method:'pickup',submitted_at:'2026-09-11T10:00:00Z',response_deadline:'2026-09-11T10:10:00Z',food_preview:changed?{available:false,groups:[],total_groups:null,total_lines:null,remaining_groups:null,remaining_lines:null,truncated:false}:summary});
 await page.route('**/RST_fixture/order-configuration/',r=>r.fulfill({json:{intake_released:false,pickup:null,delivery:null}}));
 await page.route('**/RST_fixture/order-feed/**',r=>r.fulfill({json:{changed:changed?[row()]:[],removed:[],cursor:'RFC_a',as_of:'2026-09-11T10:00:00Z'}}));
 await page.route('**/RST_fixture/orders/**',r=>{if(new URL(r.request().url()).pathname.includes('ROR_'))details++;return r.fulfill({json:{items:[row()],total:1,as_of:'2026-09-11T10:00:00Z'}});});
 await open(page);await page.getByRole('button',{name:'Orders',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Separate food',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Plate 1',exact:true})).toBeVisible();await expect(page.getByText(/Foods omitted in total: 4/)).toBeVisible();await expect(page.getByText(/Respond before/)).toBeVisible();expect(details).toBe(0);
 changed=true;await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByText(/Food summary unavailable/)).toBeVisible();await expect(page.getByText(/Respond before/)).toHaveCount(0);await expect(page.getByText(/Pondu/)).toHaveCount(0);expect(details).toBe(0);
});
