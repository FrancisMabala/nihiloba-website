import {expect,it} from "vitest";
import {serviceLanguageQuery} from "../app/lib/service-transaction-link";
it("keeps the exact authorized-navigation hints without carrying foreign scope or redirects",()=>{
 const query=new URLSearchParams(serviceLanguageQuery("?view=work&request=SWR_one&quote=SQT_one&organization_ref=BUS_other&return_to=https://evil.invalid"));
 expect(Object.fromEntries(query)).toEqual({view:"work",request:"SWR_one",quote:"SQT_one"});
 expect(serviceLanguageQuery("?view=calendar&offering=SVC_one")).toBe("?view=calendar&offering=SVC_one");
 expect(serviceLanguageQuery("?booking=RSV_one")).toBe("?booking=RSV_one");
 expect(serviceLanguageQuery("?request=SWR_one&request=SWR_other")).toBe("");
 expect(serviceLanguageQuery("?view=unknown&quote=SQT_one")).toBe("");
 expect(serviceLanguageQuery("?view=proposals&request=SPR_one&proposal=SPF_one&offering=SVC_one"))
  .toBe("?view=proposals&offering=SVC_one&request=SPR_one&proposal=SPF_one");
 expect(serviceLanguageQuery("?proposal=SPF_one")).toBe("?proposal=SPF_one");
 expect(serviceLanguageQuery("?request=SPR_one&proposal=SPF_one&booking=RSV_one")).toBe("");
 expect(serviceLanguageQuery("?proposal=SPF_one&proposal=SPF_other")).toBe("");
});
