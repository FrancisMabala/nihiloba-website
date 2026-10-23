import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,expect,it,vi} from "vitest";
import {WenzeCollection} from "../app/components/shida/wenze";
import {ApartmentCollectionPage,HotelCollectionPage} from "../app/components/shida/marketplace-pages";
import {JobCollectionPage} from "../app/components/shida/jobs";
import {TransportDiscovery} from "../app/components/shida/transport-discovery";
import {getHotels} from "../app/services/shida/public-client";
import {parseHotelSearch} from "../app/lib/hotel-search";
import {HotelCard} from "../app/components/shida/marketplace";
import type {HotelListing} from "../app/types/shida-public";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()}),usePathname:()=>"/shida/wenze"}));
afterEach(()=>vi.unstubAllGlobals());
it.each(["en","fr","ln","sw"] as const)("keeps %s discovery public, localized and without promotional art",async locale=>{
 const fetcher=vi.fn(async(input:RequestInfo|URL)=>{const url=String(input);return Response.json(url.includes('/jobs?')?{items:[],pagination:{page:1,page_size:12,total_items:0,total_pages:1}}:url.includes('/apartments')?{items:[],count:0,total:0,page:1,page_size:12,filters:{property_types:["house"]}}:{items:[],count:0,has_more:false,next_cursor:null});});vi.stubGlobal("fetch",fetcher);
 const pages=[await WenzeCollection({l:locale,search:{}}),await WenzeCollection({l:locale,search:{view:"shops"}}),await ApartmentCollectionPage({locale}),await HotelCollectionPage({locale}),await JobCollectionPage({locale,search:{}}),<TransportDiscovery key="transport" locale={locale}/>];
 for(const page of pages){const html=renderToStaticMarkup(page);expect(html).toContain('mp-discovery-header');expect(html).not.toContain('class="mp-art');expect(html).not.toContain('/home/employment.png');expect(html).toContain(`${locale==="en"?"":`/${locale}`}/shida`);}
 const text=renderToStaticMarkup(pages[0]);expect(text).toContain(({en:"Search products",fr:"Rechercher un produit",ln:"Luka eloko",sw:"Tafuta bidhaa"})[locale]);
 expect(fetcher.mock.calls.some(([url])=>String(url).includes('/wenze/products?'))).toBe(true);
});
it("uses real server-side hotel filters and bounds malformed search",async()=>{
 const search=parseHotelSearch({query:" Jardin ",area:"Gombe",rooms:"2",rental_period:"night",check_in:"2026-12-01",guest_phone:"private"});
 expect(search).toEqual({query:"Jardin",area:"Gombe",rooms:2,rental_period:"night"});
 expect(parseHotelSearch({rooms:"0",rental_period:"instant",city:"x".repeat(200)})).toEqual({city:"x".repeat(120)});
 const fetcher=vi.fn().mockResolvedValue(Response.json({items:[],count:0}));vi.stubGlobal("fetch",fetcher);await getHotels(search);
 expect(String(fetcher.mock.calls[0][0])).toContain("query=Jardin&area=Gombe&rooms=2&rental_period=night");expect(String(fetcher.mock.calls[0][0])).not.toContain("private");
});
it("keeps hotel price currencies and periods separate",()=>{
 const room={name:"Room",price:80,currency:"USD",rental_period:"night",capacity:2,total_rooms:2,image_reference:null,image_references:[],description:null};
 const hotel:HotelListing={public_ref:"HOT_TEST",slug:"hotel",name:"Hotel",description:null,country_code:"CD",city:"Kinshasa",area:null,commune:null,quartier:null,address_line:null,landmark:null,room_types:[room,{...room,price:20000,currency:"CDF"},{...room,price:30,rental_period:"day"}],public_detail_url:"/shida/hotels/hotel",booking_url:null};
 const html=renderToStaticMarkup(<HotelCard listing={hotel} locale="en"/>);expect(html).toContain("80.00");expect(html).toContain("20,000");expect(html).toContain("30.00");expect(html).toContain("night");expect(html).toContain("day");
});
it("hands Wewa requests to the implemented command without claiming a booking",()=>{
 const html=renderToStaticMarkup(<TransportDiscovery locale="en"/>);expect(html).toContain("text=wewa");expect(html).toContain("Send the prepared message");expect(html).not.toContain('<form');expect(html).not.toContain('<img');
});
