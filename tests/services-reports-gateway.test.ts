import {describe,it,expect} from 'vitest';
import {transactionQuery,transactionSearch} from '../app/lib/services-transaction-contract';
const base='start_date=2026-10-01&end_date=2026-11-01';
describe('report filter gateway boundaries',()=>{
 it('forwards supported service and currency filters without provider scope',()=>{
  for(const [kind,filter] of [['operational','offering_ref=SVC_example'],['financial.csv','currency=USD']]){
   const parts=['transactions','reports',kind],query=new URLSearchParams(`${base}&${filter}`);
   expect(transactionQuery(parts,query,'GET')).toBe(true);
   expect(transactionSearch(parts,query).toString()).toBe(query.toString());
  }
 });
 it.each(['organization_ref=BUS_other','actor_id=2','currency=EUR','currency=CDF&currency=USD','offering_ref=SVC_other','timezone=Pacific/Auckland'])('rejects finance scope or invalid filters %s',filter=>{
  expect(transactionQuery(['transactions','reports','financial'],new URLSearchParams(`${base}&${filter}`),'GET')).toBe(false);
 });
});
