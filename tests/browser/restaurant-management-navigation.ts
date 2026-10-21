import {expect,type Page} from '@playwright/test';
export async function managementNavigation(page:Page,name:string){
 await expect(page.locator('.rst-bottom-nav')).toBeAttached();
 if(await page.locator('.rst-bottom-nav').isVisible()){
  const direct=page.locator('.rst-bottom-nav').getByRole('button',{name:name==='Maagizo'?'Oda':name,exact:true});
  if(await direct.count()){await direct.click();return;}
  await page.locator('.rst-bottom-nav button').last().click();
  await page.locator('.rst-more').getByRole('button',{name,exact:true}).click();return;
 }
 await expect(page.locator('#restaurant-navigation')).toBeAttached();
 const button=page.locator('#restaurant-navigation').getByRole('button',{name,exact:true,includeHidden:true});
 const group=page.locator('.rst-desktop-group').filter({has:page.getByRole('button',{name,exact:true,includeHidden:true})});
 if(await group.count()&&await group.getAttribute('open')===null)await group.locator('summary').click();
 await button.click();
}
