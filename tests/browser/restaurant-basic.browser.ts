import {test,expect} from '@playwright/test';
import {fixture,open} from './restaurant-c1e-fixture';
import {basicText} from '../../app/lib/restaurant-basic-copy';
import {workText} from '../../app/lib/restaurant-work-copy';

for(const [locale,width] of [['en',320],['fr',390],['ln',768],['sw',1280]] as const)test(`basic statistics ${locale} ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});
 await fixture(page);await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();
 let reads=0;
 await page.route(/\/order-summary\/?(?:\?|$)/,route=>{reads++;return route.fulfill({json:{as_of:'2026-09-13T12:00:00Z',coverage_from:'2026-01-01T00:00:00Z',coverage_to:'2026-09-13T12:00:00Z',measurement_status:'available',metrics:{submitted_orders:3,completed_in_period:2,status_breakdown:{completed:2,rejected:1},completed_food_value:{CDF:'420000.00',USD:'35.00'},completed_delivery_fees:{CDF:'1000.00'},average_completed_food_value:{CDF:'210000.00',USD:'17.50'},by_method:{pickup:{submitted:2,completed:1},takeaway:{submitted:1,completed:1}},response_time:{samples:2,average_seconds:30},preparation_time:{samples:1,average_seconds:120},popular_foods:{items:[{item_ref:'RMI_private_internal_locator',name:'Pondu',pricing_model:'UNIT_PRICED',units:34,sale_unit_label:'portion',currency:'CDF',occurrences:2}],total:1}}}});});
 await page.getByRole('button',{name:workText(locale,'activity'),exact:true}).click();
 await page.getByRole('button',{name:basicText(locale,'today'),exact:true}).click();
 await expect(page.getByText('Pondu: 34 portion · CDF')).toBeVisible();
 await expect(page.getByText('420000.00 CDF',{exact:true})).toBeVisible();
 await expect(page.getByText('35.00 USD',{exact:true})).toBeVisible();
 await expect(page.getByText(basicText(locale,'paymentNote'))).toBeVisible();
 await expect(page.getByText('RMI_private_internal_locator')).toHaveCount(0);
 await page.waitForTimeout(1000);expect(reads).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`statistics-${locale}-${width}.png`),fullPage:true});
});

test('explicit flexible portions use the existing item writer',async({page})=>{
 const state=await fixture(page);await open(page);
 await page.getByRole('button',{name:'My menu',exact:true}).click();
 await page.getByRole('button',{name:'+ Add',exact:true}).click();
 await page.getByLabel('Name',{exact:true}).fill('Pondu flexible');
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('RMC_fixture');
 await page.getByRole('radio',{name:'By amount',exact:true}).check();
 await page.getByRole('combobox',{name:'Portion pricing',exact:true}).selectOption('flexible');
 await page.getByRole('textbox',{name:'Minimum amount',exact:true}).fill('500');
 await page.getByLabel('Amount increment (optional)',{exact:true}).fill('100');
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 await expect.poll(()=>state.writes.length).toBe(1);
 expect(state.writes[0].body?.fields).toMatchObject({amount_mode:'flexible',minimum_amount:'500',amount_step:'100',allowed_amounts:[]});
});
