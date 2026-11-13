import {assertSearchLayout} from './shared-search-layout';
import {test,expect} from '@playwright/test';
import {JOBS_SLOGAN} from '../../app/lib/brand';
for(const locale of ['en','fr','ln','sw'])for(const width of [390,1440])test(`final Jobs branding and invitations ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:960});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/emplois`);
 await expect(page.locator('#main-content .jobs-brand-slogan')).toHaveCount(1);await expect(page.locator('#main-content .jobs-brand-slogan')).toHaveText(JOBS_SLOGAN);await expect(page.locator('#main-content .jobs-brand-slogan')).toHaveAttribute('lang','ln');
 await expect(page.locator('#main-content .jobs-public-topline,.jobs-header-row')).toHaveCount(0);
 await expect(page.locator('#main-content .jobs-invitation')).toHaveCount(3);
 await expect(page.locator('#main-content .jobs-invitation-candidate .button')).toHaveAttribute('href',/^https:\/\/wa.me\//);
 await expect(page.locator('#main-content .jobs-invitation-personal .button')).toHaveAttribute('href',/^https:\/\/wa.me\//);
 await expect(page.locator('#main-content .jobs-invitation-business .button')).toHaveAttribute('href','https://business.nihiloba.com/');
 await expect(page.locator('#main-content .jobs-invitation-candidate a').last()).toHaveAttribute('href',/\/(my-applications|mes-candidatures)\/?$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/jobs-final-${locale}-${width}.png`,fullPage:true});
});
for(const width of [360,390,768,1024,1440])test(`employment discovery and detail at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:960});await page.goto('/shida/emplois');
 await expect(page.getByRole('heading',{name:'Jobs',exact:true})).toBeVisible();
 await assertSearchLayout(page,width); await expect(page.locator('.job-result')).toHaveCount(5);
 for(const amount of ['180 USD / month','25 USD / day','20 USD / intervention'])await expect(page.getByText(amount,{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/jobs-home-${width}.png`,fullPage:true});
 await page.getByRole('link',{name:'Jobs from individuals',exact:true}).click();await expect(page.locator('.job-result')).toHaveCount(2);
 await page.screenshot({path:`test-results/jobs-individual-${width}.png`,fullPage:true});
 await page.getByRole('link',{name:'Company & organisation offers',exact:true}).click();await expect(page.locator('.job-result')).toHaveCount(3);
 await page.getByRole('link',{name:'Skilled trades',exact:true}).click();await expect(page.locator('.job-result')).toHaveCount(2);
 await page.screenshot({path:`test-results/jobs-category-${width}.png`,fullPage:true});
 await page.getByRole('link',{name:'Electrical technician (test)',exact:true}).click();
 await expect(page.locator('.job-detail-highlights')).toContainText('20 USD / intervention');
 await expect(page.getByRole('link',{name:'Continue in WhatsApp'})).toHaveAttribute('href',/^https:\/\/wa.me\//);
 await expect(page.locator('.job-application-panel')).toContainText('does not submit an application');
 await expect(page.locator('.job-my-applications')).toHaveAttribute('href',/^\/shida\/my-applications\/?$/);
 await expect(page.locator('.job-similar .job-result')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('heading',{name:'Electrical technician (test)',exact:true}).click();
 await page.screenshot({path:`test-results/jobs-detail-${width}.png`,fullPage:true});
});
test('search, empty, failure, pagination and expired states',async({page})=>{
 await page.goto('/shida/emplois');await page.getByRole('searchbox').fill('Learning');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.locator('.job-result')).toHaveCount(1);await page.screenshot({path:'test-results/jobs-search.png',fullPage:true});
 await page.goto('/shida/emplois?query=missing');await expect(page.getByText('No jobs match your search')).toBeVisible();await page.screenshot({path:'test-results/jobs-empty.png',fullPage:true});
 await page.goto('/shida/emplois?query=failure');await expect(page.locator('.job-api-error')).toContainText('temporarily unavailable');await page.screenshot({path:'test-results/jobs-error.png',fullPage:true});
 await page.goto('/shida/emplois?view=professional&page_size=1');await expect(page.locator('.job-result')).toHaveCount(1);await page.getByRole('link',{name:'Next',exact:true}).click();await expect(page).toHaveURL(/page=2/);
 await page.goto('/shida/emplois/expired');await expect(page.getByText('Expired offer',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Apply on employer website'})).toHaveCount(0);await page.screenshot({path:'test-results/jobs-expired.png',fullPage:true});
});
test('recruitment contact stays private until a signed-in candidate applies', async ({page}) => {
 let signedIn = false;
 let reveals = 0;
 await page.route('**/api/shida/employment/session/', route => route.fulfill(signedIn
   ? {json:{binding:'a'.repeat(64),user:{display_name:'Candidate'}}}
   : {status:401,json:{detail:'sign_in_required'}}));
 await page.route('**/api/shida/personal/job-search/jobs/JOB_contact/recruitment-contact/**', async route => {
   expect(route.request().method()).toBe('POST');
   expect(route.request().headers()['x-shida-session']).toBe('a'.repeat(64));
   reveals++;
   await route.fulfill({json:{email:'apply@example.org',phone:'+243812345678'}});
 });
 const navigation = await page.goto('/shida/emplois/JOB_contact');
 expect(await navigation!.text()).not.toContain('apply@example.org');
 const apply = page.getByRole('button',{name:'Apply with the recruiter'});
 await apply.click();
 await expect(page.getByText('Sign in to see the recruitment contact details.')).toBeVisible();
 expect(reveals).toBe(0);
 signedIn = true;
 await page.reload();
 await expect(apply).toBeVisible();
 await expect(page.locator('a[href="mailto:apply@example.org"]')).toHaveCount(0);
 expect(reveals).toBe(0);
 await apply.click();
 await expect(page.getByRole('link',{name:/Send an email/})).toHaveAttribute('href','mailto:apply@example.org');
 await expect(page.getByRole('link',{name:/Call.*243812345678/})).toHaveAttribute('href','tel:+243812345678');
 expect(reveals).toBe(1);
 await page.evaluate(() => window.dispatchEvent(new Event('shida-personal-session-changed')));
 await expect(page.locator('a[href="mailto:apply@example.org"], a[href="tel:+243812345678"]')).toHaveCount(0);
});
for(const locale of ['fr','ln','sw'])test(`localized Jobs ${locale}`,async({page})=>{await page.goto(`/${locale}/shida/emplois`); await expect(page.locator('.job-result')).toHaveCount(5);await expect(page.locator('#main-content .jobs-public')).toHaveAttribute('lang',locale);await page.screenshot({path:`test-results/jobs-${locale}.png`,fullPage:true});});
