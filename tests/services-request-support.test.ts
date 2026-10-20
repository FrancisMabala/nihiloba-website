import {expect,it} from "vitest";
import {safeSupportUrl,requestSupportCopy} from "../app/lib/services-request-support-copy";
it("opens only the configured WhatsApp support command and never includes request content",()=>{
 expect(safeSupportUrl("https://wa.me/243811000000?text=support")).toBe("https://wa.me/243811000000?text=support");
 for(const value of [null,"javascript:alert(1)","https://wa.me.evil.invalid/243811000000?text=support","https://wa.me/243811000000?text=private","https://wa.me/243811000000?text=support&brief=private"])
  expect(safeSupportUrl(value)).toBeNull();
 for(const locale of ["en","fr","ln","sw"] as const)expect(Object.values(requestSupportCopy(locale)).every(value=>value.length>5)).toBe(true);
});
