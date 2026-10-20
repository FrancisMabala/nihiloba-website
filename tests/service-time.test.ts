import {describe,it,expect} from "vitest";
import {inclusiveDateRange,serviceLocalInput,serviceUtcInput,serviceAmount,shiftDay,serviceProposalInput} from "../app/lib/service-time";

describe("Services local entry preserves canonical date/time and money semantics",()=>{
 it("maps one inclusive day and leap/month/year ends to half-open calendar dates",()=>{
  expect(inclusiveDateRange("2028-02-29","2028-02-29")).toEqual({start_date:"2028-02-29",end_date:"2028-03-01"});
  expect(inclusiveDateRange("2026-12-01","2026-12-31").end_date).toBe("2027-01-01");
  expect(shiftDay("2026-03-01",-1)).toBe("2026-02-28");
  expect(()=>inclusiveDateRange("2026-02-29","2026-03-01")).toThrow();
  expect(()=>inclusiveDateRange("2026-10-02","2026-10-01")).toThrow();
 });
 it("round-trips Kinshasa input including the previous UTC day",()=>{
  expect(serviceUtcInput("2026-10-21T00:30")).toBe("2026-10-20T23:30:00.000Z");
  expect(serviceLocalInput("2026-10-20T23:30:00Z")).toBe("2026-10-21T00:30");
  expect(serviceLocalInput("2026-10-20T23:30:00")).toBe("2026-10-21T00:30");
  expect(serviceUtcInput("2026-10-21T09:00")).toBe("2026-10-21T08:00:00.000Z");
  for(const value of ["2026-02-30T10:00","2026-10-21T24:00","2026-10-21T10:60",""])expect(()=>serviceUtcInput(value)).toThrow();
 });
 it("accepts either decimal keyboard without rounding, currency conversion or ambiguous grouping",()=>{
  expect(serviceAmount("1250,50")).toBe("1250.50");
  expect(serviceAmount("0.10")).toBe("0.10");
  expect(serviceAmount("25000")).toBe("25000");
  for(const value of ["1,000.00","1.000,00","1,000","1e3","-5","abc"])expect(()=>serviceAmount(value)).toThrow();
 });
 it("adapts legacy proposals and preserves explicit appointment timezone",()=>{
  expect(serviceProposalInput("2026-10-21","09:00","10:00","UTC")).toEqual({proposed_date:"2026-10-21",proposed_start_time:"08:00",proposed_end_time:"09:00"});
  expect(serviceProposalInput("2026-10-21","00:30","","UTC").proposed_date).toBe("2026-10-20");
  expect(serviceProposalInput("2026-10-21","09:00","10:00","Africa/Kinshasa").proposed_timezone).toBe("Africa/Kinshasa");
  expect(()=>serviceProposalInput("2026-10-21","00:30","01:30","UTC")).toThrow("unsupported_overnight_interval");
 });
});
