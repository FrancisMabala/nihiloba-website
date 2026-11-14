import {expect,it} from 'vitest';
import {validInventoryQuery,validInventoryBody} from '../app/lib/restaurant-inventory-contract';
it('accepts bounded stock search/type/status and rejects unrelated or repeated selectors',()=>{
 const path='RST_one/inventory';
 expect(validInventoryQuery(path,new URLSearchParams('page=2&page_size=20&search=Eau&stock_kind=packaged&stock_state=attention&language=fr'))).toBe(true);
 for(const q of ['stock_kind=bad','stock_state=bad','search='+ 'x'.repeat(161),'page_size=100','search=a&search=b','owner=other'])expect(validInventoryQuery(path,new URLSearchParams(q))).toBe(false);
 expect(validInventoryQuery(path+'/items/RII_a/history',new URLSearchParams('search=x'))).toBe(false);
});
it('accepts exact stock creation and kind commands without permitting mismatched units or fields',()=>{
 const body={operation_key:'fixture',name:'Eau',purpose:'sellable',stock_kind:'packaged',unit:'bottle',opening_quantity:'0'};
 expect(validInventoryBody('RST_a/inventory/items',body)).toBe(true);
 expect(validInventoryBody('RST_a/inventory/items',{...body,unit:'kg'})).toBe(false);
 expect(validInventoryBody('RST_a/inventory/items',{...body,owner:'other'})).toBe(false);
 expect(validInventoryBody('RST_a/inventory/items/RII_a/kind',{operation_key:'fixture',expected_revision:1,stock_kind:'packaged'})).toBe(true);
});
