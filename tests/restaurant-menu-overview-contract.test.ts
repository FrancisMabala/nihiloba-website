import {expect,it} from 'vitest';
import {validSellerQuery} from '../app/lib/restaurant-seller-contract';
it('permits bounded scoped menu filters and refuses duplicate or unrelated selectors',()=>{
 const path='RST_test/menu/items';
 expect(validSellerQuery(path,'GET',new URLSearchParams('overview=true&search=Eau&category_ref=RMC_test&menu_state=hidden&page=2&page_size=20'))).toBe(true);
 for(const query of ['overview=yes','page_size=100','category_ref=RST_other','menu_state=anything','search='+ 'x'.repeat(201),'search=a&search=b','owner=other'])expect(validSellerQuery(path,'GET',new URLSearchParams(query))).toBe(false);
 expect(validSellerQuery(path+'/RMI_test','GET',new URLSearchParams('overview=true&language=fr'))).toBe(true);
 expect(validSellerQuery(path+'/RMI_test','GET',new URLSearchParams('search=x'))).toBe(false);
});

it('permits selected-day specials without accepting unrelated or duplicate selectors',()=>{
 const path='RST_test/menu/offerings';
 expect(validSellerQuery(path,'GET',new URLSearchParams('overview=true&day=2027-01-04&page=1&page_size=20&language=sw'))).toBe(true);
 for(const query of ['day=tomorrow','day=2027-01-04&day=2027-01-05','owner=other','overview=yes','page_size=100'])expect(validSellerQuery(path,'GET',new URLSearchParams(query))).toBe(false);
});
