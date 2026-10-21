import {test,expect} from '@playwright/test';
for(const width of [360,820,1440])test(`Services public discovery ${width}`,async({page})=>{
 await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)?route.continue():route.abort();});
 await page.setViewportSize({width,height:950});await page.goto('/fr/shida/services');
 await expect(page.getByRole('heading',{level:1})).toHaveText('La bonne personne pour votre prochain projet.');
 await expect(page.locator('.service-card')).toHaveCount(3);
 await expect(page.locator('.mp-hero').getByRole('link',{name:'Décrire mon besoin'})).toHaveAttribute('href','/fr/shida/service-requests/?new=1');
 await expect(page.getByRole('link',{name:'Mon espace prestataire'})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/shared-public/services-fr-${width}.png`,fullPage:true});
 await page.getByRole('navigation',{name:'Explorer par catégorie'}).getByRole('link',{name:'Nettoyage'}).click();
 await expect(page.locator('.service-card')).toHaveCount(1);expect(new URL(page.url()).searchParams.get('category')).toBe('cleaning');
 const result=page.locator('.service-card h2 a');await expect(result).toHaveText('Home cleaning');await expect(result).toHaveAttribute('href',/^\/fr\/shida\/services\/cleaning\/?$/);
 await result.click();await expect(page).toHaveURL(/127\.0\.0\.1:3027\/fr\/shida\/services\/cleaning\/?$/);await expect(page.getByRole('heading',{level:1})).toHaveText('Home cleaning');await expect(page.locator('.service-booking-flow')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Services empty and unavailable states keep working search and provider entry',async({page})=>{
 await page.goto('/shida/services?query=empty');await expect(page.getByText('No public services match your search.')).toBeVisible();
 await page.goto('/shida/services?query=failure');await expect(page.getByText(/Services are temporarily unavailable/)).toBeVisible();await expect(page.getByRole('link',{name:'Offer a service'})).toBeVisible();
});
