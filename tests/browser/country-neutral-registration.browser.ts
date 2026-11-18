import {test,expect} from '@playwright/test';
import {fixture,fillCountry,fillName} from './registration-fixture';
import {registrationCopy,registrationEligibility,existingAccountContinue} from '../../app/lib/registration/copy';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';

for(const locale of ['fr','en','ln','sw'] as const)test(`${locale}: Meda login panel retains detail destination during signup`,async({page})=>{
 await fixture(page);
 await page.setViewportSize({width:390,height:844});
 const base=locale==='en'?'':`/${locale}`,destination=`${base}/shida/meda/?view=detail&ref=MED_fixture`;
 await page.goto(destination);
 await page.locator('.meda-access button').click();
 const signup=page.locator('.wzp-buyer-login .login-register a');
 await expect(signup).toHaveAttribute('href',`${base}/shida/register/?returnTo=${encodeURIComponent(destination)}`);
 await signup.click();
 expect(new URL(page.url()).searchParams.get('returnTo')).toBe(destination);
 await expect(page.getByRole('button',{name:registrationCopy[locale].next,exact:true})).toBeVisible();
});

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,1440])test(`${locale} ${width}: residence independent of verified phone and safe Meda return`,async({page})=>{
 const state=await fixture(page),t=registrationCopy[locale],login=personalLoginCopy[locale];
 const country=locale==='ln'?'CD':'SE',city=country==='CD'?'Kinshasa':'Stockholm',phone=locale==='fr'?'+243910004001':'+46700009101';
 await page.setViewportSize({width,height:900});
 const base=locale==='en'?'':`/${locale}`,destination=`${base}/shida/meda/?view=detail&ref=MED_fixture`;
 await page.goto(`${base}/shida/register/?returnTo=${encodeURIComponent(destination)}`);
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await fillName(page,'Synthetic Diaspora');await fillCountry(page,country);await page.locator('#registration-city').fill(city);
 if(country==='CD')await page.locator('#registration-commune').selectOption('Gombe');
 await page.locator('#registration-phone').fill(phone);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr')await page.screenshot({path:`docs/evidence/onboarding-country-neutral-20261118/website-residence-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:t.next,exact:true}).click();
 await expect(page.getByRole('button',{name:login.open,exact:true})).toBeDisabled();
 await page.getByLabel(registrationEligibility[locale]).check();
 if(locale==='fr')await page.screenshot({path:`docs/evidence/onboarding-country-neutral-20261118/website-adult-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:login.open,exact:true}).click();
 await page.getByLabel(login.codeLabel).fill('610294');await page.getByRole('button',{name:t.verifyButton,exact:true}).click();
 await expect(page.locator('.registration-consent input')).toHaveCount(2);
 for(const consent of await page.locator('.registration-consent input').all()){await expect(consent).not.toBeChecked();await consent.check();}
 await page.getByRole('button',{name:t.next,exact:true}).click();await page.getByRole('button',{name:t.finish,exact:true}).click();
 await expect(page).toHaveURL(new RegExp(destination.replace(/[?]/g,'\\?')));
 expect(state.values.country_code).toBe(country);expect(state.values.city).toBe(city);expect(state.completed).toBe(true);
});

test('existing diaspora identity stays unchanged and unsafe return falls back',async({page})=>{
 const state=await fixture(page,true);state.existingAccount=true;state.accepted=true;state.values={personal_name:'Existing Diaspora',country_code:'SE',city:'Stockholm'};
 await page.goto('/shida/register/?returnTo=https%3A%2F%2Fevil.invalid');
 await page.getByRole('button',{name:registrationCopy.en.resume,exact:true}).click();
 await page.getByRole('button',{name:existingAccountContinue.en,exact:true}).click();
 await expect(page).toHaveURL(/\/shida\/space\/?$/);expect(state.completed).toBe(false);
 expect(state.values).toEqual({personal_name:'Existing Diaspora',country_code:'SE',city:'Stockholm'});
});
