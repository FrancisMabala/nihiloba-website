import {expect,it} from "vitest";
import {parseWenzeDiscovery,wenzeDiscoveryQuery} from "../app/lib/wenze-discovery";
it("preserves all catalog filters across continuation and removes only the cursor on reset",()=>{
 const search=parseWenzeDiscovery({category:"fashion_clothing",condition:"used",currency:"USD",
   min_price:"10",max_price:"20",variant_type:"size",variant_option:"M",store:"WNZ_TEST",
   availability:"in_stock",cursor:"old",private_token:"never",query:["duplicate","query"]});
 const next=new URLSearchParams(wenzeDiscoveryQuery(search,"next"));
 expect(next.get("cursor")).toBe("next");expect(next.get("variant_option")).toBe("M");
 expect(next.get("currency")).toBe("USD");expect(next.get("store")).toBe("WNZ_TEST");
 expect(next.has("private_token")).toBe(false);expect(next.has("query")).toBe(false);
 const first=new URLSearchParams(wenzeDiscoveryQuery(search,null));
 expect(first.has("cursor")).toBe(false);expect(first.get("condition")).toBe("used");
});
