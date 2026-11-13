import {expect,it} from "vitest";
import {period} from "../app/lib/service-finance-workspace";
import {transactionQuery,transactionPath} from "../app/lib/services-transaction-contract";
it("compares Thursday with the same elapsed weekdays",()=>{
 expect(period("week","2026-11-12")).toEqual({start:"2026-11-09",end:"2026-11-12",previous:"2026-11-02"});
});
it("limits report filters to Personal scope",()=>{
 const parts=["transactions","finance","workspace"],q=new URLSearchParams({start_date:"2026-11-09",end_date:"2026-11-12",currency:"CDF"});
 expect(transactionPath(parts,"GET")).toBe("services/finance/workspace");
 expect(transactionQuery(parts,q,"GET")).toBe(true);
 q.set("organization_ref","BUS_other");expect(transactionQuery(parts,q,"GET")).toBe(false);
});
