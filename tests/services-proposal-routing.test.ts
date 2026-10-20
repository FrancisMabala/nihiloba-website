import {it, expect} from "vitest";
import {proposalPath, proposalQuery} from "../app/lib/services-proposal-routing";
import {transactionPath, transactionQuery} from "../app/lib/services-transaction-contract";

it("exposes only provider discovery and exact private proposal operations", () => {
  for (const action of ["save","submit","withdraw","ask"]) {
    expect(proposalPath(["proposals","SPF_one",action],"POST")).toBe(`service-proposals/SPF_one/${action}`);
    expect(transactionPath(["transactions","competition","proposals","SPF_one",action],"POST")).toBe(`service-proposals/SPF_one/${action}`);
  }
  for (const path of [["postings","SPR_one","accept"],["proposals","SPF_one","answer"],["briefs","SCB_one","documents"]])
    expect(proposalPath(path,"POST")).toBeNull();
  expect(proposalPath(["proposals","SPF_one","save"],"GET")).toBeNull();
});
it("rejects context injection, duplicate selectors, arbitrary paths and missing service", () => {
  const path=["postings","available"];
  expect(proposalQuery(path,new URLSearchParams("offering_ref=SVC_one"),"GET")).toBe(true);
  expect(transactionQuery(["transactions","competition",...path],new URLSearchParams("offering_ref=SVC_one"),"GET")).toBe(true);
  for(const query of ["","offering_ref=SVC_one&organization_ref=BUS_other","offering_ref=SVC_one&offering_ref=SVC_two",
    "offering_ref=SVC_one&before_ref=../../x","offering_ref=SVC_one&customer=true"])
    expect(proposalQuery(path,new URLSearchParams(query),"GET")).toBe(false);
  expect(proposalQuery(["proposals","SPF_one","save"],new URLSearchParams("offering_ref=SVC_one"),"POST")).toBe(false);
});
