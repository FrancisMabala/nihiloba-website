import {test,expect} from '@playwright/test';
for(const width of [390,1440])test('Personal mission and application at '+width,async({page})=>{
 await page.setViewportSize({width,height:840});
 const job={type:'job',status:'open',reference:'JOB_demo',title:'Garde d’enfants en soirée',count:0,location:'Kinshasa, Kintambo'};
 let submitted=0;const work={name:'Grace M.',city:'Kinshasa',communes:['Kintambo'],missions:[{category:'childcare',tasks:['Garder les enfants'],experience:'friends',rate:'agree'}],days:['sat'],slots:['evening'],frequency:[]};
 await page.route('**/api/shida/personal/job-offer?**',async r=>{const q=new URL(r.request().url()).searchParams;
 if(q.get('kind')==='catalogue')return r.fulfill({json:{rows:[job,{type:'article',title:'Chemise',reference:'PRD_one',status:'online',price:'25000',currency:'CDF'},{type:'service',title:'Retouches',reference:'SVC_one',status:'available',count:1}]}});
 if(q.get('kind')==='manage')return r.fulfill({json:{...job,version:'1',values:{job:job.title}}});
 if(q.get('kind')==='applications')return r.fulfill({json:{records:[]}});
 if(r.request().method()==='POST'){expect(r.request().postDataJSON()).toMatchObject({confirmed:true,message:'Samedi soir.'});submitted++;return r.fulfill({json:{application:'APP_example'}})}
 return r.fulfill({json:{...job,profile:work}});
 });
 await page.goto('/fr/shida/space?view=listings');await expect(page.getByRole('button',{name:'Toutes (3)'})).toBeVisible();
 await page.getByRole('button',{name:'Offres d’emploi (1)'}).click();await expect(page.getByText('Chemise')).toHaveCount(0);
 await page.getByRole('link',{name:'Gérer la mission'}).click();await page.getByRole('link',{name:'Candidatures (0)'}).click();await expect(page.getByText('Aucun résultat pour cette mission.')).toBeVisible();
 await page.goto('/fr/shida/space?view=job-offer&kind=apply&offer=JOB_demo');await expect(page.getByText('Grace M.')).toBeVisible();await page.getByRole('textbox').fill('Samedi soir.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Envoyer ma candidature'}).click();await expect(page.getByText('Candidature envoyée')).toBeVisible();await expect(page.getByRole('link',{name:/Voir ma candidature/})).toHaveAttribute('href',/APP_example$/);expect(submitted).toBe(1)
});

test('application retains the destination through profile setup and handles a mission closing during review',async({page})=>{
 const url='/fr/shida/space?view=job-offer&kind=apply&offer=JOB_late';
 let ready=false,attempts=0;
 await page.route('**/api/shida/personal/job-offer?**',async r=>{
   if(r.request().method()==='POST'){attempts++;return r.fulfill({status:409,json:{detail:'mission_closed'}})}
   return r.fulfill({json:{title:'Mission du samedi',location:'Kinshasa',profile:ready?{name:'Grace M.',communes:[],missions:[],days:[],slots:[]}:null}})
 });
 await page.goto(url);
 await expect(page.getByRole('link',{name:'Créer mon profil occasionnel'})).toHaveAttribute('href',/profile=occasional_work.*job=JOB_late.*from=mission/);
 ready=true;await page.reload();await page.getByRole('button',{name:'Envoyer ma candidature'}).click();
 await expect(page.getByText('Cette mission n’accepte plus de candidatures.')).toBeVisible();
 await expect(page.getByRole('button',{name:'Envoyer ma candidature'})).toHaveCount(0);expect(attempts).toBe(1);
});
