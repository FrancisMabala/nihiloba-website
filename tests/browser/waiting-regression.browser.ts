import {test,expect} from '@playwright/test';
import {workPilotFixture} from './fixtures/services-work-pilot';

for(const locale of ['fr','en','ln','sw'])for(const width of [390,1440])test(`Services deferred panels and reviews ${locale} ${width}`,async({page})=>{
 const state=await workPilotFixture(page),prefix=locale==='en'?'':`/${locale}`;
 await page.route('**/transactions/finance/workspace?*',route=>route.fulfill({json:{
  start:'2026-11-18',end:'2026-11-18',currency:'CDF',
  totals:{billed:'0',received:'0',spent:'0',outstanding:'0'},days:[],entries:[],dues:[],
  methods:{},categories:{},jobs:[],previous:'2026-11-17',previous_end:'2026-11-17',previous_received:'0',advances:[],closes:[]
 }}));
 await page.setViewportSize({width,height:900});
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:3044'?route.fallback():route.abort());
 await page.goto(`${prefix}/shida/seller/services?view=work`);
 await expect(page.locator('.svc-client-work')).toBeVisible();
 expect(state.reads.filter(path=>path.endsWith('/reviews'))).toHaveLength(0);
 await page.goto(`${prefix}/shida/seller/services?view=calendar`);
 await expect(page.locator('.svc-planner-toolbar button[aria-busy]')).toBeEnabled();
 expect(state.reads.filter(path=>path.endsWith('/reviews'))).toHaveLength(0);
 await page.goto(`${prefix}/shida/seller/services?view=services&offering=SVC_one`);
 await expect(page.locator('.svc-service-editor')).toBeVisible();
 expect(state.reads.filter(path=>path.endsWith('/reviews'))).toHaveLength(0);
 await page.locator('.svc-editor-steps button').nth(3).click();
 await expect.poll(()=>state.reads.filter(path=>path.endsWith('/reviews')).length).toBe(1);
 await expect(page.locator('.svc-reviews')).toBeVisible();
 await page.locator('.svc-editor-steps button').nth(2).click();
 await expect(page.locator('.svc-reviews')).not.toBeVisible();
 await page.route('**/SVC_one/reviews/**',route=>route.fulfill({status:503,json:{detail:'synthetic unavailable'}}));
 await page.locator('.svc-editor-steps button').nth(3).click();
 await expect(page.locator('.svc-reviews [role=status]')).toHaveText(({fr:'Enregistrement impossible. Réessayez.',en:'Could not save. Please retry.',ln:'Kobomba elongi te. Meka lisusu.',sw:'Imeshindikana kuhifadhi. Jaribu tena.'} as Record<string,string>)[locale]);
 await expect(page.locator('.svc-reviews .svc-empty')).toHaveCount(0);
 // A deferred finance entry must render its real controls, not only the heading.
 await page.goto(`${prefix}/shida/seller/services?view=finance`);
 await expect(page.locator('.sf-workspace')).toBeVisible();
 await expect(page.locator('.sf-tabs button').first()).toBeVisible();
 await expect(page.locator('.sf-metrics section')).toHaveCount(5);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
