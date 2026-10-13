import { expect, type Page } from '@playwright/test';
export async function managementNavigation(page:Page,name:string) {
 await expect(page.locator('#restaurant-navigation')).toBeAttached();
 const toggle=page.locator('.rst-navigation-toggle');
 if(await toggle.isVisible() && await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
 const button=page.locator('#restaurant-navigation').getByRole('button',{name,exact:true,includeHidden:true});
 const group=button.locator('..');
 if(await group.evaluate(el=>el.tagName==='DETAILS'&&!el.hasAttribute('open')))await group.locator('summary').click();
 await button.click();
}
