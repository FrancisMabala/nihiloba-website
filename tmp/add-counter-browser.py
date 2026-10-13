from pathlib import Path

p = Path('tests/browser/restaurant-workflow.browser.ts')
s = p.read_text(encoding='utf-8')
s = s.replace("const day={", "const counterTerms={currency:'CDF',standalone:[{key:'food-1',name:'Fufu et pondu',quantity:1,sale_unit_label:'assiette',subtotal:'3000.00'}],plates:[],food_subtotal:'3000.00',delivery_fee:null,order_total:'3000.00',food_preference:null};\nconst counterBill={group_ref:'RSG_COUNTER',group_revision:4,payment_revision:0,bill_revision:'c'.repeat(64),state:'closed',chargeable_rounds:[{order_ref:'ORD_COUNTER',revision:1,state:'completed',currency:'CDF',amount:'3000.00'}],pending_rounds:[],excluded_rounds:[],currencies:{CDF:moneyTotals('3000.00','0.00','3000.00'),USD:moneyTotals('0.00','0.00','0.00')},entries:[]};\nconst day={", 1)
s = s.replace("  if(rich&&p.endsWith('/service/groups/RSG_VISIT/bill'))", "  if(rich&&p.endsWith('/service/groups/RSG_COUNTER/bill'))return json(counterBill);\n  if(rich&&p.endsWith('/service/groups/RSG_VISIT/bill'))", 1)
s = s.replace("  if(p.endsWith('/counter-baskets')&&m==='POST')", "  if(rich&&p.endsWith('/counter-baskets/BSK_1/quote'))return json({basket:{basket_ref:'BSK_1',revision:2,quote:counterTerms,quote_ref:'RQU_1',order_ref:null}});\n  if(rich&&p.endsWith('/counter-baskets/BSK_1/finalize'))return json({operation_outcome:{order_ref:'ORD_COUNTER',bill_group_ref:'RSG_COUNTER'},bill_group_ref:'RSG_COUNTER',current_order:{order_ref:'ORD_COUNTER',revision:1,state:'completed',entry_source:'counter',fulfillment_method:'on_premise',submitted_at:stamp,receipt_terms:counterTerms}});\n  if(p.endsWith('/counter-baskets')&&m==='POST')", 1)
s += """
for(const width of [360,820,1440])test(`counter handover and canonical bill ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await seed(page,true,false,true);await page.goto('/fr/shida/seller/restaurants/');
 await managementNavigation(page,'Vente au comptoir');
 await page.getByRole('button',{name:'Ajouter',exact:true}).first().click();
 await expect(page.getByText('CDF: 3000.00')).toBeVisible();
 await page.getByRole('button',{name:'Calculer le total exact'}).click();
 await expect(page.getByText('3000.00 CDF')).toBeVisible();
 await page.getByRole('button',{name:'Confirmer la remise des aliments'}).click();
 await expect(page.getByText('Référence de la facture: RSG_COUNTER')).toBeVisible();
 await expect(page.locator('.rst-money-totals')).toContainText('3000.00');
 await page.screenshot({path:`docs/evidence/workflow-counter-bill-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
"""
p.write_text(s, encoding='utf-8')
