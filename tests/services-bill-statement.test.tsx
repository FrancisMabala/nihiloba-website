import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {ServiceBillStatement,type BillStatementVersion} from '../app/components/shida/service-bill-statement';

const bill:BillStatementVersion={version_ref:'SBV_one',bill_ref:'SBF_one',revision:2,status:'issued',currency:'USD',total:'15.25',issue_date:'2026-10-14',due_date:'2026-10-21',presentation:{identity_name:'Kivu Services',display_name:'Studio Kivu',accent:'plum'},lines:[{ordinal:1,label:'Approved work',amount:'15.25'}]};

for(const locale of ['fr','en','ln','sw'] as const)it(`shows the exact frozen bill in ${locale}`,()=>{
 const html=renderToStaticMarkup(<ServiceBillStatement version={bill} locale={locale}/>);
 expect(html).toContain('Studio Kivu');expect(html).toContain('SBF_one');
 expect(html).toContain('Kivu Services');
 expect(html).toContain('Approved work');expect(html).toContain('15.25');
 expect(html).toContain('USD');expect(html).toContain('2026-10-14');
 expect(html).toContain('2026-10-21');expect(html).toContain('overflow-wrap:anywhere');
 expect(html).not.toContain('private_detail');expect(html).not.toContain('correction reason');
});
