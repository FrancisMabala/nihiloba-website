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

test('employer pages stay available while optional observations are paused',async({page})=>{
 const refs=employerFixtures(),t=statisticsCopy.fr,events:{headers:Record<string,string>;reference:string}[]=[];
 await page.addInitScript(()=>{if(!localStorage.getItem('shida_statistics_consent_v1'))localStorage.setItem('shida_statistics_consent_v1',JSON.stringify({choice:'accepted',expires:Date.now()+86400000}));});
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname,match=path.match(/\/employer-pages\/([^/]+)\/view\/?$/);
  if(match){expect(route.request().method()).toBe('POST');expect(refs).toContain(match[1]);events.push({headers:route.request().headers(),reference:match[1]});return route.fulfill({status:204});}
  if(path==='/api/shida/statistics/')return route.fulfill({status:204});
  return route.fulfill({status:404,json:{}});
 });
 const open=async(ref:string)=>{const response=await page.goto('/fr/shida/emplois/employeurs/'+encodeURIComponent(ref));expect(response?.ok()).toBe(true);await expect(page.locator('.employer-page header h1')).toBeVisible();};
 const status=page.locator('.website-statistics-control [role=status]');
 for(const ref of refs){
  await open(ref);
  await expect(status).toHaveText(t.blocked);
  await page.waitForLoadState('networkidle');
  expect(events).toHaveLength(0);
 }
});
