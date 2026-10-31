import {test,expect} from '@playwright/test';
for(const width of [360,390,768,1024,1440])test(`reports responsive reconciliation ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 let financialFailure=false,empty=false;
 const offering={public_ref:'SVC_one',provider_ref:'SVI_one',name:'Provider',service_name:'Hair styling',category:'beauty',description:'Hair care',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',home_service_available:'no',booking_mode:'time_slots',availability:'Weekdays',publication_origin:'pilot',visible_to_customers:true,requests_enabled:true,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
 const queryLog:URL[]=[];
 await page.route('**/api/shida/**',async route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Provider'}});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile','operational_reports','financial_reports'],access_policy:'pilot'});
  if(path.endsWith('/services'))return reply({profiles:[offering]});
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(path.includes('/reports/')){
   queryLog.push(url);
   if(path.endsWith('.csv'))return route.fulfill({body:'currency,declared_received\nUSD,70.00',contentType:'text/csv'});
   if(path.endsWith('/operational'))return reply({as_of:'2026-10-20T12:00:00Z',published_offerings:2,requests_created:empty?0:3,bookings_created:empty?0:2,completed_jobs:empty?0:1,pending_requests_now:0,undated_completions:1,booking_statuses:{confirmed:2},offerings:[{offering_ref:'SVC_one',offering:'Hair styling',published_now:true,requests_created:empty?0:3,bookings_created:empty?0:2,completed_jobs:empty?0:1,pending_requests_now:0,booking_statuses:{confirmed:2}}],trend:[{start_date:'2026-10-01',end_date:'2026-10-08',requests_created:empty?0:1,bookings_created:empty?0:1},{start_date:'2026-10-08',end_date:'2026-10-15',requests_created:empty?0:2,bookings_created:empty?0:1}],unavailable:[]});
   if(financialFailure)return reply({},503);
   const bucket={billed:empty?'0.00':'100.00',declared_received:empty?'0.00':'70.00',outstanding:empty?'0.00':'30.00',recorded_expenses:empty?'0.00':'20.00',declared_surplus:empty?'0.00':'50.00'};
   return reply({as_of:'2026-10-20T12:00:00Z',currencies:{USD:bucket,CDF:bucket},expense_categories:{USD:empty?{}:{transport:'20.00'},CDF:empty?{}:{transport:'20.00'}},trend:[{start_date:'2026-10-01',end_date:'2026-10-08',currencies:{USD:{...bucket,declared_received:'-10.00'},CDF:{...bucket,declared_received:'-10.00'}}},{start_date:'2026-10-08',end_date:'2026-10-15',currencies:{USD:{...bucket,declared_received:'80.00',recorded_expenses:'0.00'},CDF:{...bucket,declared_received:'80.00',recorded_expenses:'0.00'}}}]});
  }
  return reply({},404);
 });
 await page.goto('/shida/seller/services?view=reports');
 const panel=page.locator('.services-reports');
 await panel.getByRole('button',{name:'Show report',exact:true}).click();
 await expect(panel.getByRole('heading',{name:'Bookings by service'})).toBeVisible();
 await expect(panel.getByText('Hair styling: 2 (100%)')).toBeVisible();
 await page.screenshot({path:`test-results/reports-activity-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await panel.getByRole('tab',{name:'Financial reports'}).click();
 await expect(panel.getByText('50 CDF',{exact:true})).toBeVisible();
 await panel.getByRole('combobox',{name:'Currency',exact:true}).selectOption('USD');
 await panel.getByRole('button',{name:'Show report',exact:true}).click();
 await expect(panel.getByText('50 USD',{exact:true})).toBeVisible();
 await expect(panel.getByText('50 CDF',{exact:true})).toHaveCount(0);
 await page.screenshot({path:`test-results/reports-financial-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const download=page.waitForEvent('download');await panel.getByRole('button',{name:/CSV/}).click();await download;
 expect(queryLog.at(-1)?.searchParams.get('currency')).toBe('USD');
 financialFailure=true;await panel.getByRole('button',{name:'Show report',exact:true}).click();await expect(panel.getByRole('alert')).toBeVisible();
 await panel.getByRole('tab',{name:'Service activity',exact:true}).click();await expect(panel.getByRole('heading',{name:'Bookings by service'})).toBeVisible();
 await expect(panel.getByRole('alert')).toHaveCount(0);
 financialFailure=false;empty=true;await panel.getByRole('button',{name:'Show report',exact:true}).click();await expect(panel.getByText('No activity for this period',{exact:true})).toBeVisible();
 await panel.getByRole('tab',{name:'Financial reports',exact:true}).click();await expect(panel.getByText('No financial records for this period',{exact:true})).toBeVisible();
 await expect(panel.getByRole('link',{name:'Open Money and reconciliation →'}).last()).toHaveAttribute('href','?view=finance');
 await page.screenshot({path:`test-results/reports-empty-${width}.png`,fullPage:true});
});
