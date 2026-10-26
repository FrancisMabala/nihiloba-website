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

it('forwards only POST adjustments with valid sale references and no owner injection',()=>{
 const path=['transactions','finance','counter','SCS_one','adjustments'];
 expect(transactionPath(path,'POST')).toBe('services/finance/counter/SCS_one/adjustments');
 expect(transactionPath(path,'GET')).toBeNull();
 expect(transactionPath(['transactions','finance','counter','BUS_one','adjustments'],'POST')).toBeNull();
 expect(transactionQuery(path,new URLSearchParams('organization_ref=BUS_other'),'POST')).toBe(false);
});

it.each(['en','fr','ln','sw'] as const)('keeps original payment snapshots separate from corrected bills and refund receipts in %s',locale=>{
 const original={...sale,customer_name:'Original client'};
 const corrected={...sale,total:'20.00',customer_name:'Corrected client',payments:[{...sale.payments[0],document:original}]};
 const receipt=renderToStaticMarkup(<CounterDocument sale={corrected} payment={corrected.payments[0]} locale={locale}/>);
 expect(receipt).toContain('Original client');expect(receipt).not.toContain('Corrected client');
 const adjustment={adjustment_ref:'SCA_refund',kind:'refund' as const,reason_code:'customer_refund' as const,amount:'10.00',bill_delta:'0.00',method:'cash' as const,effective_date:'2026-10-02',receipt_ref:null,document:{...corrected,received:'20.00',outstanding:'0.00'}};
 const refund=renderToStaticMarkup(<CounterDocument sale={corrected} adjustment={adjustment} locale={locale}/>);
 expect(refund).toContain('SCA_refund');expect(refund).toContain('Corrected client');expect(refund).not.toContain('SCR_first');
});
