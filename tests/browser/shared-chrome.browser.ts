import {test,expect} from '@playwright/test';
for(const width of [320,390,820,1366])test(`shared account and language ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 let writes=0;const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/**',route=>{
  if(route.request().method()!=='GET')writes++;
  const path=new URL(route.request().url()).pathname;
  return route.fulfill({json:path.includes('/session')?{binding:'a'.repeat(64),user:{display_name:'Francis Mabala'}}:{}});
 });
 await page.goto('/fr/shida/space');
 const account=page.getByRole('button',{name:'Mon compte SHIDA · Francis Mabala'}),language=page.getByRole('button',{name:'Langue',exact:true});
 await expect(account).toHaveText('FM');
 await account.click();const menu=page.locator('.market-menu');await expect(menu.getByRole('link',{name:'Boîte de réception'})).toHaveAttribute('href','/fr/shida/space?view=inbox');
 await language.click();await expect(account).toHaveAttribute('aria-expanded','false');await expect(menu).toHaveCount(1);
 await page.keyboard.press('Escape');await expect(language).toBeFocused();await expect(menu).toHaveCount(0);
 await account.click();await page.getByRole('heading',{level:1}).click();await expect(menu).toHaveCount(0);
 await account.click();await menu.getByRole('link',{name:'Boîte de réception'}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Boîte de réception');
 await expect(page.getByRole('link',{name:'Demandes et messages Services'})).toHaveAttribute('href','/fr/shida/service-requests');
 await language.click();await page.getByRole('button',{name:'English',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Inbox');expect(new URL(page.url()).searchParams.get('view')).toBe('inbox');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/shared-chrome/public-account-${width}.png`,fullPage:true});
 expect(writes).toBe(0);expect(errors).toEqual([]);
});
