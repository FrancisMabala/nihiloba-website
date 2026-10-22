import {expect,test} from "vitest";
import {wenzeRouteAllowed} from "../app/lib/wenze-seller-contract";
test("bounded listing and stock filters pass only their read routes",()=>{
 expect(wenzeRouteAllowed(["stores","WNZ_test","products"],"GET",new URLSearchParams("listing_state=sold&offset=20&limit=20"))).toBe(true);
 expect(wenzeRouteAllowed(["stores","WNZ_test","inventory","stock"],"GET",new URLSearchParams("availability=out"))).toBe(true);
 expect(wenzeRouteAllowed(["stores","WNZ_test","products"],"GET",new URLSearchParams("availability=out"))).toBe(false);
 expect(wenzeRouteAllowed(["stores","WNZ_test","products"],"GET",new URLSearchParams("listing_state=sold&listing_state=all"))).toBe(false);
});
