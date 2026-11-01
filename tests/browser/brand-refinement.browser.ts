import {test,expect} from '@playwright/test';
import {discoveryCopy} from '../../app/lib/discovery-copy';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,390,768,1024,1440])test(`homepage brand ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/`);
 await expect(page.locator('h1')).toHaveText('Oza koluka nini? Tala na SHIDA!');
 await expect(page.locator('h1')).toHaveAttribute('lang','ln');
 await expect(page.locator('.discovery-hero')).toContainText(discoveryCopy[locale].intro);
 await expect(page.locator('.discovery-categories>a')).toHaveCount(7);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.discovery-search button')).toBeVisible();
 await page.screenshot({path:`test-results/brand-refinement/home-${locale}-${width}.png`});
 expect(errors).toEqual([]);
});
test('language changes description, not brand; search preserves destination',async({page})=>{
 await page.goto('/shida/');await page.locator('.market-language').click();
 await page.getByRole('button',{name:'Français',exact:true}).click();
 await expect(page.locator('h1')).toHaveText('Oza koluka nini? Tala na SHIDA!');
 await expect(page.locator('.discovery-hero')).toContainText(discoveryCopy.fr.intro);
 await page.locator('select[name=market]').selectOption('services');
 await page.locator('input[name=query]').fill('coiffure');await page.locator('input[name=city]').fill('Kinshasa');
 await page.locator('.discovery-search button').click();await page.waitForURL('**/fr/shida/services/**');
 expect(new URL(page.url()).searchParams.get('query')).toBe('coiffure');
 expect(new URL(page.url()).searchParams.get('city')).toBe('Kinshasa');
});
