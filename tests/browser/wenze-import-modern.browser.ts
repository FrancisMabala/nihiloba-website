import {test,expect} from '@playwright/test';
import {fixture} from './wenze-checkout-fixture';
import path from 'node:path';
import bulk from '../../app/lib/wenze-bulk-copy.json';
import {r6Text} from '../../app/lib/wenze-r6-copy';
for(const width of [360,390,768,1440])test(`import explicit review ${width}`,async({page})=>{await page.setViewportSize({width,height:1000});const locale=width===390||width===1440?'fr':'en';const f=await fixture(page,{locale});const writes:string[]=[];const job={import_ref:'IMPORT_fixture',review_version:1,store_ref:'WNZ_fixture',store_name:'Boutique du Fleuve',original_filename:'products.csv',status:'review',column_mapping:{name:'Name',price:'Price'},source_columns:[{name:'Name',display_name:'Name',samples:['Controlled import']},{name:'Price',display_name:'Price',samples:['9000']}],summary:{ready:1,published:0},items:[{item_ref:'ROW_fixture',review_version:1,review_state:'ready',payload:{name:'Controlled import',price:'9000',currency:'CDF',category:'other',condition:'new',description:'Test',negotiable:false,stock:5,variant_type:null,variants:[],photos:[]},errors:[],warnings:[],duplicate_candidates:[],published_product_ref:null}],publication_runs:[]};await page.route('**/api/**/catalog-imports/**',async route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,'');if(path.endsWith('/options'))return route.fallback();if(route.request().method()!=='GET'){writes.push(path);if(path.endsWith('/catalog-imports'))return route.fulfill({json:job});if(path.endsWith('/publish'))return route.fulfill({json:{run_ref:'RUN_fixture',run_version:1,total:1,remaining:0,outcomes:[{item_ref:'ROW_fixture',outcome:'published'}]}});}if(path.endsWith('/catalog-imports'))return route.fulfill({json:{jobs:[],total:0}});return route.fulfill({json:job});});await page.goto(f.url+'&view=imports');await expect(page.locator('.wp-import-upload')).toBeVisible();await page.screenshot({path:path.join(process.env.WENZE_EVIDENCE??'test-results/products-evidence',`import-${width}.png`),fullPage:true});await page.locator('.wp-import-upload input').setInputFiles({name:'products.csv',mimeType:'text/csv',buffer:Buffer.from('Name,Price\nControlled import,9000')});await expect(page.locator('.wp-import')).toContainText('Controlled import');expect(writes.filter(p=>p.endsWith('/publish'))).toHaveLength(0);await page.getByRole('button',{name:r6Text(locale,'ready_snapshot'),exact:true}).click();expect(writes.filter(p=>p.endsWith('/publish'))).toHaveLength(0);await page.screenshot({path:path.join(process.env.WENZE_EVIDENCE??'test-results/products-evidence',`import-review-${width}.png`),fullPage:true});await page.getByRole('button',{name:bulk[locale].confirm.replace('{n}','1').replace('(s)',''),exact:true}).click();await expect.poll(()=>writes.filter(p=>p.endsWith('/publish')).length).toBe(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(f.errors).toEqual([]);});

for(const locale of ['en','fr','ln','sw'] as const)test('import prompts for ambiguous quantity in '+locale,async({page})=>{
 const f=await fixture(page,{locale});
 const columns=['Product','Price','Currency','Qté'].map((name,i)=>({name,display_name:name,samples:[['Savon','2500','CDF','0'][i]]}));
 const payload={name:'Savon',price:'2500',currency:'CDF',stock:0,variants:[],photos:[]};
 const rows=['first','second'].map(item_ref=>({item_ref,review_version:1,review_state:'ready',payload,errors:[],warnings:[],duplicate_candidates:[],published_product_ref:null}));
 const mapping:Record<string,string>={name:'Product',price:'Price',currency:'Currency'};
 const job={import_ref:'WCI_test',original_filename:'liste.csv',review_version:1,store_ref:'WNZ_fixture',store_name:'Test',column_mapping:mapping,source_columns:columns,status:'ready',items:rows,summary:{ready:2},publication_runs:[]};
 let publications=0;
 await page.route('**/catalog-imports/**',async r=>{
   const path=new URL(r.request().url()).pathname.replace(/\/$/,'');
   if(path.endsWith('/options'))return r.fallback();
   if(path.endsWith('/mapping')){expect(r.request().postDataJSON().column_mapping.stock).toBe('Qté');job.column_mapping.stock='Qté';}
   if(path.endsWith('/publish'))publications++;
   return r.fulfill({json:path.endsWith('/catalog-imports')&&r.request().method()==='GET'?{jobs:[],total:0}:job});
 });
 await page.goto(f.url+'&view=imports');await expect(page.getByRole('button',{name:bulk[locale].choose})).toBeVisible();
 const file=page.locator('.wp-import-upload input');
 await file.setInputFiles({name:'too-big.csv',mimeType:'text/csv',buffer:Buffer.alloc(10*1024*1024+1)});
 await expect(page.locator('.wp-import [role=alert]')).toContainText(bulk[locale].oversize);
 await file.setInputFiles({name:'liste.csv',mimeType:'text/csv',buffer:Buffer.from('Product,Price,Currency,Qté\nSavon,2500,CDF,0')});
 await expect(page.locator('.wb-mapping')).toContainText('Qté');
 await page.locator('.wb-mapping select').first().selectOption('stock');
 await page.locator('.wb-mapping button').click();
 const cards=page.locator('.wp-import article.wz-card');
 await expect(cards).toHaveCount(2);await expect(cards.first()).toContainText(bulk[locale].fileDup);
 await expect(page.getByRole('button',{name:r6Text(locale,'ready_snapshot')})).toHaveCount(0);
 await cards.first().getByRole('checkbox').last().check();await page.getByRole('button',{name:r6Text(locale,'ready_snapshot')}).click();
 await expect(page.getByRole('button',{name:bulk[locale].confirm.replace('{n}','1').replace('(s)','')})).toBeVisible();
 expect(publications).toBe(0);
});
