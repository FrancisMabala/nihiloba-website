import {test,expect} from '@playwright/test';
import {statisticsCopy} from '../../app/lib/website-statistics-consent';

function employerFixtures(){
 const base=test.info().project.use.baseURL,origin=process.env.SHIDA_ACCEPTANCE_WEBSITE_ORIGIN;
 const generation=process.env.SHIDA_ACCEPTANCE_GENERATION,source=process.env.SHIDA_ACCEPTANCE_WEBSITE_SHA;
 const refs=(process.env.SHIDA_ACCEPTANCE_EMPLOYER_REFS||'').split(',');
 if(!base||!origin||new URL(base).origin!==origin||!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Require the approved isolated loopback Website origin');
 if(!generation||!/^[a-f0-9]{32}$/.test(generation)||!source||!/^[a-f0-9]{40}$/.test(source))throw Error('Require fixture generation and full runtime Website SHA from the QA pin report');
 if(refs.length!==2||new Set(refs).size!==2||refs.some(ref=>!/^ORGDIR_[A-Za-z0-9_-]+$/.test(ref)))throw Error('Require two distinct public organization-directory references in SHIDA_ACCEPTANCE_EMPLOYER_REFS');
 // The acceptance owner verifies these bindings against the current runtime and
 // fixture manifest before running; browser route mocks cannot supply SSR data.
 test.info().annotations.push({type:'acceptance-fixture',description:JSON.stringify({origin,generation,source,refs})});
 return refs;
}

test('an employer page observes visible visits with separate receipts and company-scoped sessions',async({page})=>{
 const refs=employerFixtures(),t=statisticsCopy.fr,events:{headers:Record<string,string>;reference:string}[]=[];
 await page.addInitScript(()=>{if(!localStorage.getItem('shida_statistics_consent_v1'))localStorage.setItem('shida_statistics_consent_v1',JSON.stringify({choice:'declined',expires:Date.now()+86400000}));});
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname,match=path.match(/\/employer-pages\/([^/]+)\/view\/?$/);
  if(match){expect(route.request().method()).toBe('POST');expect(refs).toContain(match[1]);events.push({headers:route.request().headers(),reference:match[1]});return route.fulfill({status:204});}
  if(path==='/api/shida/statistics/')return route.fulfill({status:204});
  return route.fulfill({status:404,json:{}});
 });
 const open=async(ref:string)=>{const response=await page.goto('/fr/shida/emplois/employeurs/'+encodeURIComponent(ref));expect(response?.ok()).toBe(true);await expect(page.locator('.employer-page header h1')).toBeVisible();};
 const status=page.locator('.website-statistics-control [role=status]');
 await open(refs[0]);await expect(status).toHaveText(t.off);expect(events).toHaveLength(0);
 const preferences=page.getByRole('button',{name:t.settings,exact:true});await preferences.click();await expect(preferences).toHaveAttribute('aria-expanded','true');
 await page.getByRole('button',{name:t.accept,exact:true}).click();await expect(status).toHaveText(t.on);await expect.poll(()=>events.length).toBe(1);
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));expect(events).toHaveLength(1);
 await page.reload();await expect(status).toHaveText(t.on);await expect.poll(()=>events.length).toBe(2);
 expect(events.map(event=>event.reference)).toEqual([refs[0],refs[0]]);
 expect(events[1].headers['x-shida-event']).not.toBe(events[0].headers['x-shida-event']);
 expect(events[1].headers['x-shida-visitor']).toBe(events[0].headers['x-shida-visitor']);
 await open(refs[1]);await expect.poll(()=>events.length).toBe(3);expect(events[2].reference).toBe(refs[1]);
 expect(events[2].headers['x-shida-visitor']).not.toBe(events[0].headers['x-shida-visitor']);
 await page.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{value:'1'}));await open(refs[0]);
 await expect(status).toHaveText(t.blocked);await page.waitForLoadState('networkidle');expect(events).toHaveLength(3);
});
