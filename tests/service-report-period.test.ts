import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
import {reportHelp,reportPeriod} from "../app/lib/service-report-period";
import {inclusiveDateRange} from "../app/lib/service-time";
import {ServicesReportsPanel} from "../app/components/shida/services-reports-panel";

describe("inclusive report periods preserve the reporting API",()=>{
 it("uses Monday through today, including year and Sunday boundaries",()=>{
  expect(reportPeriod("week","2027-01-01")).toEqual({start:"2026-12-28",end:"2027-01-01"});
  expect(reportPeriod("week","2026-10-25")).toEqual({start:"2026-10-19",end:"2026-10-25"});
  expect(reportPeriod("week","2026-10-19")).toEqual({start:"2026-10-19",end:"2026-10-19"});
 });
 it("includes the selected end date in the existing half-open API",()=>{
  const period=reportPeriod("month","2028-02-29");
  expect(inclusiveDateRange(period.start,period.end)).toEqual({start_date:"2028-02-01",end_date:"2028-03-01"});
  expect(()=>reportPeriod("month","2026-02-30")).toThrow();
 });
 for(const locale of ["en","fr","ln","sw"] as const)it(`shows understandable date controls and optional definitions in ${locale}`,()=>{
  const html=renderToStaticMarkup(createElement(ServicesReportsPanel,{base:"/api/services",binding:"test",locale,financialAllowed:false}));
  expect(html).toContain(reportHelp[locale].week);
  expect(html).toContain(reportHelp[locale].month);
  expect(html).toContain(reportHelp[locale].dates);
  expect(html).not.toContain("excluded");
  expect(html).not.toContain("T00:00:00");
 });
});
