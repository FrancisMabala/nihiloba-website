import {it,expect} from 'vitest';
import {transactionPath,transactionQuery} from '../app/lib/services-transaction-contract';
it('routes reminder mutations and rejects injected scope',()=>{
 const parts=['transactions','reservations','RSV_one','bills','SBF_one','reminder'];
 expect(transactionPath(parts,'POST')).toBe('services/reservations/RSV_one/bills/SBF_one/reminder');
 expect(transactionPath(parts,'GET')).toBeNull();
 expect(transactionQuery(parts,new URLSearchParams('organization_ref=BUS_wrong'),'POST')).toBe(false);
});
