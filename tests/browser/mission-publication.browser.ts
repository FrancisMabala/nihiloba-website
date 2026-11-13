import {expect,test} from '@playwright/test';
import {personalOfferCopy} from '../../app/lib/personal-offer-copy';
for(const width of [390,1440])test('publish an overnight mission '+width,async({page})=>{
 const c=personalOfferCopy.fr;let stored={},revision=1,done=false;
 await page.route('**/api/**',async r=>{const d={public_ref:'PJO_demo',revision,state:done?'completed':'active',values:stored,result_job_ref:done?'JOB_demo':null};
 if(r.request().method()==='GET')return r.fulfill({json:{progress:[],identity:{city:'Stockholm'},capacity:{used:0,limit:3},locations:{kinshasa_communes:['Lemba','Limete'],quartiers:{Lemba:['École'],Limete:['Résidentiel']}}}});
 const b=r.request().postDataJSON();if(b.action==='preview'){const m=JSON.parse(b.values.mission_terms);expect(m.overnight).toBe(true);expect(m.weekdays).toEqual([]);return r.fulfill({json:{...b.values,work_schedule:'De 18 h à 1 h le lendemain',duration_frequency:'Une seule fois · Date à convenir'}})}
 if(b.action==='save'){stored=b.values;revision++}if(b.action==='finalize')done=true;return r.fulfill({json:{...d,revision,values:stored,state:done?'completed':'active',result_job_ref:done?'JOB_demo':null}});
 });await page.setViewportSize({width,height:880});await page.goto('/fr/shida/space?view=job-offer&intent=mission');const form=page.locator('.occ-wizard');
 await form.getByRole('combobox',{name:/Type de travail/}).fill('bar');await form.getByRole('option',{name:'Service au bar lors d’un événement',exact:true}).click();
 await form.getByLabel('Que devra faire la personne ?').fill('Servir les boissons pendant la soirée.');
 const city=form.locator('#select-work_city');await expect(city).toHaveValue('');await city.fill('Kin');await city.press('ArrowDown');await city.press('Enter');
 const commune=form.locator('#select-commune');await commune.click();await form.getByRole('option',{name:'Lemba'}).click();
 const district=form.locator('#select-quartier');await district.click();await expect(form.getByRole('option',{name:'Résidentiel'})).toHaveCount(0);await form.getByRole('option',{name:'École'}).click();
 await commune.click();await form.getByRole('option',{name:'Limete'}).click();await expect(district).toHaveValue('');await form.getByRole('button',{name:'Mon quartier ne figure pas dans la liste'}).click();
 await form.getByRole('textbox',{name:'Quartier (facultatif)',exact:true}).fill('gggg');await form.getByRole('button',{name:c.next,exact:true}).click();await expect(form.getByRole('alert')).toBeVisible();await form.getByRole('textbox',{name:'Quartier (facultatif)',exact:true}).fill('N’dolo');await form.getByRole('button',{name:c.next,exact:true}).click();
 for(const name of ['Régulièrement','Samedi','Une seule fois'])await form.getByRole('button',{name,exact:true}).click();
 await form.getByLabel('Date à convenir',{exact:true}).check();await form.getByRole('button',{name:'Horaires fixes'}).click();await form.getByLabel('Heure de début').fill('18:00');await form.getByLabel('Heure de fin').fill('01:00');await form.getByLabel('Se termine le lendemain').check();await form.getByRole('button',{name:'Vérifier l’annonce',exact:true}).click();
 await expect(form).toContainText('De 18 h à 1 h le lendemain');await expect(form.getByRole('button',{name:'Publier l’annonce'})).toBeDisabled();await form.getByLabel('J’ai vérifié les informations de cette annonce').check();await form.getByRole('button',{name:'Modifier les conditions'}).click();await form.getByRole('button',{name:'Horaires fixes'}).click();await form.getByLabel('Heure de début').fill('18:00');await form.getByLabel('Heure de fin').fill('01:00');await form.getByLabel('Se termine le lendemain').check();await form.getByRole('button',{name:'Vérifier l’annonce',exact:true}).click();
 await expect(form.getByLabel('J’ai vérifié les informations de cette annonce')).not.toBeChecked();await form.getByLabel('J’ai vérifié les informations de cette annonce').check();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await form.getByRole('button',{name:'Publier l’annonce'}).click();await expect(page.getByRole('link',{name:'Voir les candidatures'})).toHaveAttribute('href',/kind=applications&offer=JOB_demo/);
 await expect(page.getByRole('link',{name:'Trouver des candidats pour cette mission'})).toHaveAttribute('href',/kind=candidates&offer=JOB_demo/);
});
test('legacy draft preserves unlisted location and asks for unclear terms in context',async({page})=>{
 const values={job:'Garde à domicile',work_city:'Kinshasa',commune:'Lemba',quartier:'Ancien quartier',short_summary:'Accompagner les enfants à la maison.',duration_frequency:'Travail occasionnel',work_schedule:'Lun, Mer · 15:00–18:00',budget:'2000 CDF / heure',optional_experience:'Débutant accepté'};
 await page.route('**/api/shida/personal/job-offer/**',r=>r.fulfill({json:{capacity:{used:1,limit:3},locations:{kinshasa_communes:['Lemba'],quartiers:{}},progress:[{public_ref:'PJO_old',state:'active',revision:3,values}]}}));
 await page.goto('/fr/shida/space?view=job-offer&intent=mission&draft=PJO_old');const w=page.locator('.mission-wizard');
 await expect(w.getByRole('textbox',{name:'Quartier (facultatif)'})).toHaveValue('Ancien quartier');
 await expect(w).not.toContainText('Travail occasionnel');await w.getByLabel(/Type de travail/).click();await w.getByRole('option').first().click();
 await w.getByRole('button',{name:'Continuer'}).click();await expect(w).toContainText('Travail occasionnel');
 await expect(w.getByLabel('Heure de début')).toHaveValue('15:00');await expect(w.locator('#mission-amount input')).toHaveValue('2000');
 await w.getByRole('button',{name:'Régulièrement',exact:true}).click();await expect(w).not.toContainText('Travail occasionnel');
 await expect(w.getByRole('button',{name:'Lundi',exact:true})).toHaveAttribute('aria-pressed','true');
});
