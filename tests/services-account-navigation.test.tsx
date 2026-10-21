import {expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {AccountSpace} from "../app/components/shida/account-space";
import {servicesAccountCopy,servicesProviderAccess} from "../app/lib/services-account-navigation";

it("distinguishes verified ownership from setup eligibility and unavailable discovery",()=>{
 expect(servicesProviderAccess([{public_ref:"SVC_owned",is_active:"no"}],["profile"])).toBe("provider");
 expect(servicesProviderAccess([],["profile"])).toBe("setup");
 for(const profiles of [null,{},[{}],[{public_ref:"OTHER_record"}]])expect(servicesProviderAccess(profiles,["profile"])).toBe("unavailable");
 expect(servicesProviderAccess([{public_ref:"SVC_owned"}],[])).toBe("unavailable");
 expect(servicesProviderAccess([],null)).toBe("unavailable");
});
it.each(["en","fr","ln","sw"] as const)("puts customer destinations in %s account activity without assuming provider access",locale=>{
 const html=renderToStaticMarkup(<AccountSpace locale={locale}/>),prefix=locale==="en"?"":`/${locale}`;
 expect(html).toContain(servicesAccountCopy[locale].requests);
 expect(html).toContain(servicesAccountCopy[locale].bills);
 expect(html).toContain(`href="${prefix}/shida/service-bills"`);
 expect(html).toContain(`href="${prefix}/shida/service-requests"`);
 expect(html).not.toContain(`href="${prefix}/shida/seller/services"`);
});
