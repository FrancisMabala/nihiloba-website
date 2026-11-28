import {test,expect,type Page} from '@playwright/test';
import {statisticsCopy} from '../../app/lib/website-statistics-consent';

const copy={
 en:{required:'This field is required.',selection:'Please select an option.'},
 fr:{required:'Ce champ est obligatoire.',selection:'Veuillez sélectionner une option.'},
 ln:{required:'Esika oyo esengeli kotondisama.',selection:'Poná likambo moko.'},
 sw:{required:'Sehemu hii ni ya lazima.',selection:'Tafadhali chagua chaguo.'},
};

async function fixture(page:Page,html:string,locale='en'){
 const baseURL=test.info().project.use.baseURL;
 if(!baseURL || !['localhost','127.0.0.1','[::1]'].includes(new URL(baseURL).hostname))throw Error('Use the approved isolated loopback Website runtime');
 await page.route('**/api/**',route=>route.fulfill({status:404,json:{}}));
 await page.addInitScript(expectedOrigin=>{
  // Init hooks also run on teardown documents such as opaque about:blank.
  if(!['http:','https:'].includes(location.protocol)||location.origin!==expectedOrigin)return;
  localStorage.setItem('shida_statistics_consent_v1',JSON.stringify({choice:'declined',expires:Date.now()+86400000}));
 },new URL(baseURL).origin);
 await page.goto('/en/privacy/');
 await expect(page.locator('.website-statistics-control [role="status"]')).toHaveText(statisticsCopy.en.blocked);
 await page.evaluate(({html,locale})=>{
  const root=document.createElement('section');root.id='validation-fixture';root.lang=locale;
  root.style.cssText='padding:24px 24px 160px;background:white';root.innerHTML=html;
  document.body.prepend(root);
  for(const form of root.querySelectorAll('form'))form.addEventListener('submit',event=>{event.preventDefault();form.dataset.submissions=String(Number(form.dataset.submissions||0)+1);});
 },{html,locale});
 return page.locator('#validation-fixture');
}

for(const locale of ['en','fr','ln','sw'] as const)test(`native invalid burst and group clearing ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const root=await fixture(page,`<form>
  <p id="name-help">Existing name help</p><label>Service name<input required aria-describedby="name-help" aria-invalid="false"></label>
  <fieldset><legend>Category</legend><p id="category-help">Choose one category</p>
   <label><input type="radio" name="category[]:é" value="a" required aria-describedby="category-help" aria-invalid="false">First category</label>
   <label><input type="radio" name="category[]:é" value="b" required aria-describedby="category-help">Second category</label>
   <label><input type="radio" name="category[]:é" value="c" required>Third category</label>
  </fieldset>
  <label><input type="checkbox" required>Confirm details</label>
  <label>City<select required><option value="">Choose</option><option value="goma">Goma</option></select></label>
  <label>Description<textarea required></textarea></label>
  <label>Email<input type="email" required value="not-an-email"></label>
  <button type="submit">Continue</button>
 </form>`,locale);
 const name=root.getByLabel('Service name'),next=root.getByRole('button',{name:'Continue'}),radios=root.getByRole('radio');
 await next.click();await expect(name).toBeFocused();await expect(root.locator('.shida-field-error')).toHaveCount(6);
 await expect(root.getByText(copy[locale].selection,{exact:true})).toHaveCount(2); // one radio group and one select
 const radioIds=await radios.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-describedby')!.split(/\s+/).find(id=>id.startsWith('shida-constraint-error-'))));
 expect(new Set(radioIds).size).toBe(1);expect(radioIds[0]).toBeTruthy();
 await name.press('Enter');await expect(name).toBeFocused();await expect(root.locator('.shida-field-error')).toHaveCount(6);
 expect((await name.getAttribute('aria-describedby'))!.split(/\s+/)).toHaveLength(2);
 await expect(root.locator('form')).not.toHaveAttribute('data-submissions');
 await name.fill('Synthetic service');await expect(name).toHaveAttribute('aria-describedby','name-help');await expect(name).toHaveAttribute('aria-invalid','false');
 await next.click();await expect(radios.first()).toBeFocused();
 await root.getByLabel('Third category').check();
 await expect(root.locator('fieldset .shida-field-error')).toHaveCount(0);
 await expect(root.locator('fieldset + .shida-field-error')).toHaveCount(0);
 await expect(radios.first()).toHaveAttribute('aria-describedby','category-help');await expect(radios.first()).toHaveAttribute('aria-invalid','false');
 await expect(radios.nth(1)).toHaveAttribute('aria-describedby','category-help');await expect(radios.nth(1)).not.toHaveAttribute('aria-invalid');
 await expect(radios.nth(2)).not.toHaveAttribute('aria-describedby');
 await root.getByLabel('Confirm details').check();await root.getByLabel('City').selectOption('goma');
 await root.getByLabel('Description').fill('Synthetic description');await root.getByLabel('Email').fill('fixture@example.test');
 await expect(root.locator('.shida-field-error')).toHaveCount(0);
 await next.click();await expect(root.locator('form')).toHaveAttribute('data-submissions','1');
});

test('native form ownership separates same names and does not merge unnamed radios',async({page})=>{
 const root=await fixture(page,`<form id="validation-a"><fieldset><legend>First form</legend>
  <label><input type="radio" name="shared" required>First A</label><label><input type="radio" name="shared" required>Second A</label>
  </fieldset><button>Validate A</button><button type="reset">Reset A</button></form>
  <label><input type="radio" form="validation-a" name="shared" required>External A</label>
  <form id="validation-b"><fieldset><legend>Second form</legend>
  <label><input type="radio" name="shared" required>First B</label><label><input type="radio" name="shared" required>Second B</label>
  </fieldset><button>Validate B</button></form>
  <form id="validation-unnamed"><label><input type="radio" required>Unnamed one</label><label><input type="radio" required>Unnamed two</label><button>Validate unnamed</button></form>`);
 await root.getByRole('button',{name:'Validate A',exact:true}).click();await expect(root.getByLabel('First A')).toBeFocused();
 await expect(root.locator('.shida-field-error')).toHaveCount(1);
 const firstId=await root.getByLabel('First A').getAttribute('aria-describedby');expect(await root.getByLabel('External A').getAttribute('aria-describedby')).toBe(firstId);
 await root.getByRole('button',{name:'Validate B',exact:true}).click();await expect(root.getByLabel('First B')).toBeFocused();
 await expect(root.locator('.shida-field-error')).toHaveCount(2);expect(await root.getByLabel('First B').getAttribute('aria-describedby')).not.toBe(firstId);
 await root.getByLabel('Second B').check();await expect(root.locator('.shida-field-error')).toHaveCount(1);await expect(root.getByLabel('First A')).toHaveAttribute('aria-invalid','true');
 await root.getByRole('button',{name:'Reset A',exact:true}).click();await expect(root.locator('.shida-field-error')).toHaveCount(0);await expect(root.getByLabel('External A')).not.toHaveAttribute('aria-describedby');
 // An unnamed radio's required attribute alone does not produce valueMissing.
 // Give each independent control a real native constraint before submitting.
 await root.locator('#validation-unnamed input').evaluateAll(nodes=>nodes.forEach(node=>(node as HTMLInputElement).setCustomValidity('Synthetic constraint')));
 expect(await root.locator('#validation-unnamed input').evaluateAll(nodes=>nodes.every(node=>(node as HTMLInputElement).validity.customError))).toBe(true);
 await root.getByRole('button',{name:'Validate unnamed',exact:true}).click();await expect(root.getByLabel('Unnamed one')).toBeFocused();await expect(root.locator('.shida-field-error')).toHaveCount(2);
 const unnamedIds=await root.locator('#validation-unnamed input').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-describedby')));
 expect(unnamedIds.every(Boolean)).toBe(true);expect(new Set(unnamedIds).size).toBe(2);
 await root.getByLabel('Unnamed two').evaluate(node=>(node as HTMLInputElement).setCustomValidity(''));
 await root.getByLabel('Unnamed two').check();await expect(root.locator('.shida-field-error')).toHaveCount(1);
 await expect(root.getByLabel('Unnamed one')).toHaveAttribute('aria-invalid','true');await expect(root.getByLabel('Unnamed two')).not.toHaveAttribute('aria-invalid');
 await expect(root.locator('#validation-unnamed')).not.toHaveAttribute('data-submissions');
});

test('native validation proxy focuses its visible control and clears after its change handler',async({page})=>{
 // This exercises the shared validator contract, not the current MissionWizard.
 const root=await fixture(page,`<form><fieldset><legend>Schedule</legend>
  <label><input id="proxy-visible" type="checkbox">Monday</label>
  <input aria-label="Selected days" data-validation-focus="#proxy-visible" required tabindex="-1" aria-describedby="proxy-help" style="position:absolute;width:1px;height:1px;opacity:0">
  <p id="proxy-help">Choose a day</p></fieldset><label>Notes<textarea required></textarea></label><button>Continue</button></form>`);
 await root.getByLabel('Monday').evaluate(checkbox=>checkbox.addEventListener('change',()=>{
  // A controlled-value update runs after the document capture listener.
  checkbox.closest('fieldset')!.querySelector<HTMLInputElement>('[data-validation-focus]')!.value=(checkbox as HTMLInputElement).checked?'selected':'';
 }));
 await root.getByRole('button',{name:'Continue'}).click();await expect(root.getByLabel('Monday')).toBeFocused();
 await expect(root.locator('.shida-field-error')).toHaveCount(2);await expect(root.getByLabel('Selected days')).toHaveAttribute('aria-invalid','true');
 await expect(root.locator('form')).not.toHaveAttribute('data-submissions');
 await root.getByLabel('Monday').check();await expect(root.locator('.shida-field-error')).toHaveCount(1);
 await expect(root.getByLabel('Selected days')).toHaveAttribute('aria-describedby','proxy-help');await expect(root.getByLabel('Selected days')).not.toHaveAttribute('aria-invalid');
 await root.getByRole('button',{name:'Continue'}).click();await expect(root.getByLabel('Notes')).toBeFocused();
 await root.getByLabel('Notes').fill('Synthetic schedule note');await root.getByRole('button',{name:'Continue'}).click();
 await expect(root.locator('form')).toHaveAttribute('data-submissions','1');await expect(root.locator('.shida-field-error')).toHaveCount(0);
});

test('translations, disable/reset and detached pending targets do not leave stale errors or focus',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const root=await fixture(page,`<button type="button" id="validation-safe">Safe focus</button><form><fieldset>
  <label>Name<input required aria-describedby="cleanup-help" aria-invalid="false" data-shida-invalid="previous"></label><p id="cleanup-help">Existing help</p>
  <label><input type="radio" name="cleanup" required>Option one</label><label><input type="radio" name="cleanup" required>Option two</label>
 </fieldset><button>Continue</button><button type="reset">Reset</button></form>`);
 await root.getByRole('button',{name:'Continue'}).click();await expect(root.getByLabel('Name')).toBeFocused();await expect(root.locator('.shida-field-error')).toHaveCount(2);
 await root.evaluate(node=>node.setAttribute('lang','fr'));await expect(root.getByText(copy.fr.required,{exact:true})).toHaveCount(1);await expect(root.getByText(copy.fr.selection,{exact:true})).toHaveCount(1);
 await root.locator('fieldset').evaluate(node=>(node as HTMLFieldSetElement).disabled=true);await expect(root.locator('.shida-field-error')).toHaveCount(0);
 await expect(root.getByLabel('Name')).toHaveAttribute('aria-describedby','cleanup-help');await expect(root.getByLabel('Name')).toHaveAttribute('aria-invalid','false');await expect(root.getByLabel('Name')).toHaveAttribute('data-shida-invalid','previous');
 await root.locator('fieldset').evaluate(node=>(node as HTMLFieldSetElement).disabled=false);
 await root.getByRole('button',{name:'Continue'}).click();await expect(root.locator('.shida-field-error')).toHaveCount(2);
 await root.getByRole('button',{name:'Reset',exact:true}).click();await expect(root.locator('.shida-field-error')).toHaveCount(0);
 // Remove the first invalid target in the native callback, before the queued task.
 await root.locator('form').evaluate(form=>form.addEventListener('invalid',()=>{form.querySelector('fieldset')?.remove();document.getElementById('validation-safe')!.focus();},{capture:true,once:true}));
 await root.getByRole('button',{name:'Continue'}).click();await expect(root.getByRole('button',{name:'Safe focus'})).toBeFocused();await expect(root.locator('.shida-field-error')).toHaveCount(0);
 await page.goto('about:blank');expect(errors).toEqual([]);
});

test('a later form validation supersedes pending focus from another form',async({page})=>{
 const root=await fixture(page,`<form id="validation-first"><label>First form name<input required></label></form>
  <form id="validation-last"><label>Last form name<input required></label><label>Last form description<textarea required></textarea></label></form>
  <button type="button">Check both forms</button>`);
 await root.getByRole('button',{name:'Check both forms'}).evaluate(button=>button.addEventListener('click',()=>{
  (document.getElementById('validation-first') as HTMLFormElement).requestSubmit();
  (document.getElementById('validation-last') as HTMLFormElement).requestSubmit();
 }));
 await root.getByRole('button',{name:'Check both forms'}).click();
 await expect(root.getByLabel('Last form name')).toBeFocused();await expect(root.locator('.shida-field-error')).toHaveCount(3);
 await expect(root.locator('form[data-submissions]')).toHaveCount(0);
});
