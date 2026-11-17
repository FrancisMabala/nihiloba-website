import {managementCopy} from '../../app/lib/restaurant-management-copy';
import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
import {workspaceCopy} from '../../app/lib/restaurant-workspace-copy';
import {expect,type Page} from '@playwright/test';
export async function managementNavigation(page:Page,name:string){
 const locale=(Object.keys(managementCopy) as (keyof typeof managementCopy)[]).find(l=>[managementCopy[l].settings,sellerDesignCopy[l].hours,sellerDesignCopy[l].sharing].includes(name));
 if(locale){await managementNavigation(page,sellerDesignCopy[locale].profile);const label=name===managementCopy[locale].settings?workspaceCopy[locale].configuration:name===sellerDesignCopy[locale].hours?workspaceCopy[locale].hours:workspaceCopy[locale].sharing;await page.locator('.rst-local-tabs').getByRole('button',{name:label,exact:true}).click();return;}
 const profileLocale=(Object.keys(sellerDesignCopy) as (keyof typeof sellerDesignCopy)[]).find(l=>sellerDesignCopy[l].profile===name);if(profileLocale)name=workspaceCopy[profileLocale].establishment;
 await expect(page.locator('.management-mobile-nav')).toBeAttached();
 if(await page.locator('.management-mobile-nav').isVisible()){
  const direct=page.locator('.management-mobile-nav').getByRole('button',{name,exact:true});
  if(await direct.count()){await direct.click();return;}
  await page.locator('.management-mobile-nav button').last().click();
  await page.locator('.management-more-sheet').getByRole('button',{name,exact:true}).click();return;
 }
 await expect(page.locator('#restaurant-navigation')).toBeAttached();
 const button=page.locator('#restaurant-navigation').getByRole('button',{name,exact:true,includeHidden:true});
 const group=page.locator('.rst-desktop-group').filter({has:page.getByRole('button',{name,exact:true,includeHidden:true})});
 if(await group.count()&&await group.getAttribute('open')===null)await group.locator('summary').click();
 await button.click();
}
