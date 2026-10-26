import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {CounterDocument,counterCents,type CounterSale} from '../app/components/shida/services-counter';
import {transactionPath,transactionQuery} from '../app/lib/services-transaction-contract';

const sale:CounterSale={sale_ref:'SCS_test',customer_name:null,presentation:{display_name:'Belleza Salon'},currency:'USD',total:'30.00',received:'30.00',outstanding:'0.00',effective_date:'2026-10-01',lines:[{offering_ref:'SVC_test',package_ref:'SPK_test',service_name:'Hair styling',package_name:'Wash and braids',quantity:2,unit_price:'15.00',amount:'30.00'}],payments:[{receipt_ref:'SCR_first',amount:'10.00',method:'cash',effective_date:'2026-10-01'},{receipt_ref:'SCR_second',amount:'20.00',method:'mobile_money',effective_date:'2026-10-02'}]};
it.each(['en','fr','ln','sw'] as const)('renders frozen business and package names, retaining the original partial receipt in %s',locale=>{
 const html=renderToStaticMarkup(<CounterDocument sale={sale} payment={sale.payments[0]} locale={locale}/>);
 expect(html).toContain('Belleza Salon');expect(html).toContain('Wash and braids');expect(html).toContain('Hair styling');expect(html).toContain('SCR_first');expect(html).toContain('20.00');expect(html).not.toContain('SCR_second');
 const bill=renderToStaticMarkup(<CounterDocument sale={sale} locale={locale}/>);
 expect(bill).toContain('SCS_test');expect(bill).not.toContain('SCR_first');
});
it('uses exact cents, including amounts beyond safe floating point precision',()=>{
 expect(counterCents('90071992547409.93').toString()).toBe('9007199254740993');
 expect(counterCents('0,10')+counterCents('0.20')).toBe(BigInt(30));
 for(const value of ['1.001','-1','NaN','Infinity','1e3'])expect(()=>counterCents(value)).toThrow();
});
it('only forwards explicit Counter paths and rejects injected owner scopes',()=>{
 expect(transactionPath(['transactions','finance','counter'],'POST')).toBe('services/finance/counter');
 expect(transactionPath(['transactions','finance','counter','SCS_one','payments'],'POST')).toBe('services/finance/counter/SCS_one/payments');
 expect(transactionPath(['transactions','finance','counter','SCS_one','payments'],'GET')).toBeNull();
 expect(transactionQuery(['transactions','finance','counter'],new URLSearchParams('organization_ref=BUS_other'),'GET')).toBe(false);
 expect(transactionQuery(['transactions','finance','counter'],new URLSearchParams('offset=0&offset=1'),'GET')).toBe(false);
});
