import {test,expect} from '@playwright/test';
import {templateDesign} from '../../app/lib/services-template-design';
import {providerCopy} from '../../app/lib/services-provider-copy';

const labels={en:{name:'Template name',amount:'Amount',save:'Save template',new:'New template',line:'Line description',detail:'Private detail',terms:'Scope & conditions',edit:'Edit',billName:'Business or professional name',brandSave:'Save presentation'},fr:{name:'Nom du modèle',amount:'Montant',save:'Enregistrer le modèle',new:'Nouveau modèle',line:'Description de ligne',detail:'Détail privé',terms:'Portée et conditions',edit:'Modifier',billName:'Nom de l’entreprise ou nom professionnel',brandSave:'Enregistrer'},ln:{name:'Nkombo ya modèle',amount:'Motango',save:'Bomba modèle',new:'Modèle ya sika',line:'Ndimbola ya molongo',detail:'Ndimbola ya sekele',terms:'Makambo mpe mibeko',edit:'Bongisa',billName:'Nkombo ya entreprise to ya mosala',brandSave:'Bomba'},sw:{name:'Jina la kiolezo',amount:'Kiasi',save:'Hifadhi kiolezo',new:'Kiolezo kipya',line:'Maelezo ya mstari',detail:'Maelezo ya faragha',terms:'Wigo na masharti',edit:'Hariri',billName:'Jina la biashara au la kitaaluma',brandSave:'Hifadhi'}} as const;
const cases=[['en',360,'beauty_wellness'],['en',390,'professional_services'],['en',768,'repair_maintenance'],['en',1024,'education_training'],['en',1440,'professional_services'],['fr',390,'professional_services'],['ln',768,'beauty_wellness'],['sw',360,'repair_maintenance']] as const;
for(const [locale,width,category] of cases)test(`templates and settings ${locale} ${width} ${category}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.addInitScript(lang=>localStorage.setItem('shida-language',lang),locale);
 const d=templateDesign[locale],t=labels[locale],ui=providerCopy[locale];
 const services=['Consultation','Follow-up'].map((name,i)=>({public_ref:`SVC_${i}`,provider_ref:'SVI_one',professional_profile:{name:'Horizon',bio:'Advice',photo:null},name:'Horizon',service_name:name,category,description:'Scope for this service',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',home_service_available:'yes',booking_mode:'flexible',availability:'Weekdays',publication_origin:'pilot',visible_to_customers:true,requests_enabled:true,is_active:'yes',revision:1,missing_fields:[],packages:[{public_ref:`PKG_${i}`,name:'Consultation package',price:'50.00',currency:'USD',duration_minutes:60,description:'Agreed advice'}],rating:{average:null,count:0}}));
 const templates:Record<string,unknown>[]=[];const writes:string[]=[];let lost=true;const bodies:string[]=[];const receipts=new Map<string,unknown>();
 let presentation={display_name:null as string|null,accent:'slate',revision:1,fallback_display_name:'Horizon',preview:{display_name:'Horizon',accent:'slate'}};
 await page.route('**/api/shida/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/services/onboarding'))return reply({progress:[],remaining_capacity:4,professional_profile:{public_ref:'SVI_one',revision:1,name:'Provider',bio:null,primary_category:'repair_maintenance'}});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Provider'}});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile','quote_templates','bill_templates','bills','requests_quotes','reservations','messages'],access_policy:'pilot'});
  if(path.endsWith('/services'))return reply({profiles:services});if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(path.endsWith('/bill-presentation')){if(req.method()==='PATCH'){const body=req.postDataJSON();presentation={...presentation,...body,revision:2};writes.push('branding');}return reply(presentation);}
  if(path.endsWith('/templates')&&req.method()==='GET')return reply({templates:templates.filter(row=>row.kind===url.searchParams.get('kind'))});
  if(path.includes('/templates/SDT_')&&req.method()==='PATCH'){const body=req.postDataJSON();const row=templates.find(row=>path.endsWith(String(row.template_ref)))!;Object.assign(row,body,{revision:Number(row.revision)+1});writes.push('edit');return reply(row);}
  if(path.endsWith('/templates')&&req.method()==='POST'){
   const body=req.postDataJSON();bodies.push(req.postData()!);if(receipts.has(body.idempotency_key))return reply(receipts.get(body.idempotency_key));
   const value={...body,template_ref:`SDT_${templates.length+1}`,revision:1,archived:false,updated_at:"2026-10-30T12:00:00Z"};templates.push(value);receipts.set(body.idempotency_key,value);writes.push('template');
   if(lost){lost=false;return route.abort('failed');}return reply(value);
  }
  return reply({},404);
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=templates`);
 const panel=page.locator('.svc-templates');await expect(panel.getByText(d.empty)).toBeVisible();
 await page.screenshot({path:`test-results/template-empty-${locale}-${width}.png`,fullPage:true});
 await panel.getByRole('button',{name:t.new,exact:false}).click();expect(writes).toHaveLength(0);
 await panel.getByLabel(d.source).selectOption('SVC_0');await expect(panel.getByLabel(t.name)).toHaveValue('Consultation');
 await page.screenshot({path:`test-results/template-basics-${locale}-${width}.png`,fullPage:true});
 const next=()=>panel.getByRole('button',{name:new RegExp(`^${d.next}`)}).click();await next();
 await panel.getByLabel(d.package).selectOption('PKG_0');await expect(panel.getByLabel(t.amount,{exact:true})).toHaveValue('50.00');await next();
 await panel.getByRole("textbox",{name:t.terms,exact:true}).fill('Advice only. Representation excluded.');await next();
 await expect(panel.getByText(d.previewOnly)).toBeVisible();await expect(panel.getByText('Advice only. Representation excluded.')).toBeVisible();expect(writes).toHaveLength(0);
 await page.screenshot({path:`test-results/template-review-${locale}-${width}.png`,fullPage:true});
 await panel.getByRole('button',{name:t.save,exact:true}).click();
 await expect(panel.getByRole('button',{name:ui.retry,exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:t.save,exact:true})).toBeDisabled();
 await panel.getByRole('button',{name:ui.retry,exact:true}).click();await expect(panel.locator('article').getByRole('heading',{name:'Consultation',exact:true})).toBeVisible();expect(bodies[0]).toBe(bodies[1]);
 expect(templates[0].content).toMatchObject({amount:'50.00',currency:'USD',terms:'Advice only. Representation excluded.'});
 await page.screenshot({path:`test-results/template-list-${locale}-${width}.png`,fullPage:true});
 await panel.locator('summary').click();await panel.getByRole('button',{name:d.duplicate,exact:true}).click();await expect(panel.getByLabel(t.name)).toHaveValue('Consultation');
 await panel.getByLabel(t.name).fill('Second consultation');await next();await expect(panel.getByLabel(t.amount,{exact:true})).toHaveValue('50.00');await next();await expect(panel.getByRole("textbox",{name:t.terms,exact:true})).toHaveValue('Advice only. Representation excluded.');await next();await panel.getByRole('button',{name:t.save,exact:true}).click();await expect(panel.locator('article')).toHaveCount(2);
 await panel.locator('article').filter({has:page.getByRole('heading',{name:'Consultation',exact:true})}).getByRole('button',{name:t.edit,exact:true}).click();await next();await next();await panel.getByRole('textbox',{name:t.terms,exact:true}).fill('Updated future conditions');await next();await panel.getByRole('button',{name:t.save,exact:true}).click();await expect(panel.locator('article')).toHaveCount(2);expect((templates[1].content as Record<string,unknown>).terms).toBe('Advice only. Representation excluded.');
 await panel.getByRole('button',{name:d.bills,exact:true}).click();await panel.getByRole('button',{name:t.new,exact:false}).click();await panel.getByLabel(t.name).fill('General bill');await next();await panel.getByLabel(t.line,{exact:true}).fill('Agreed advice');await panel.getByLabel(t.amount,{exact:true}).fill('80');await panel.getByLabel(t.detail,{exact:true}).fill('Private cost note');await next();await next();await panel.getByRole('button',{name:t.save,exact:true}).click();await expect(panel.locator('article')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=settings`);
 const branding=page.locator('.svc-branding');await expect(branding.locator('.svc-branding-profile strong')).toHaveText('Horizon');await branding.getByLabel(t.billName).fill('Horizon Practice');await branding.getByRole('radio',{name:({en:'Plum',fr:'Prune',ln:'Violet',sw:'Zambarau'} as const)[locale],exact:true}).check();
 await expect(branding.locator('.service-bill-identity strong')).toHaveText('Horizon Practice');await expect(branding.locator('.service-bill-identity p')).toContainText('Horizon');await branding.getByRole('button',{name:t.brandSave,exact:true}).click();
 await page.screenshot({path:`test-results/template-settings-${locale}-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(writes).toEqual(['template','template','edit','template','branding']);
});
