import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { filterPublicHotels, parseHotelSearch } from "../app/lib/hotel-search";
import { HotelCollectionPage } from "../app/components/shida/marketplace-pages";
import HotelRoute from "../app/(default)/shida/hotels/page";
import FrenchHotelRoute from "../app/(localized)/[lang]/shida/hotels/page";
import type { HotelListing } from "../app/types/shida-public";

const hotel: HotelListing = {public_ref:"HOT-SEARCH",slug:"hotel-jardin",name:"Hôtel du Jardin",description:"Calm rooms",country_code:"CD",city:"Kinshasa",area:null,commune:"Gombe",quartier:null,address_line:null,landmark:null,room_types:[],public_detail_url:"https://nihiloba.com/shida/hotels/hotel-jardin",booking_url:null};
const other: HotelListing = {...hotel,public_ref:"HOT-OTHER",slug:"lac",name:"Lac",city:"Goma",commune:null};
afterEach(()=>vi.unstubAllGlobals());

it("normalizes bounded public search values without accepting unrelated parameters",()=>{
  expect(parseHotelSearch({query:["  hôtel  ","ignored"],city:"  ",booking:"private",page:"2"})).toEqual({query:"hôtel"});
  expect(parseHotelSearch({query:"x".repeat(140)}).query).toHaveLength(120);
});
it("matches accents and case and combines keyword with city",()=>{
  expect(filterPublicHotels([hotel,other],{query:"HOTEL",city:"kinshasa"})).toEqual([hotel]);
  expect(filterPublicHotels([hotel,other],{query:"gombe"})).toEqual([hotel]);
  expect(filterPublicHotels([hotel,other],{query:"jardin",city:"Goma"})).toEqual([]);
  expect(filterPublicHotels([hotel,other],{})).toEqual([hotel,other]);
});
it("passes normalized search through both public hotel routes",async()=>{
  const searchParams=Promise.resolve({query:" Jardin ",city:"Kinshasa"});
  expect((await HotelRoute({searchParams})).props).toMatchObject({locale:"en",search:{query:"Jardin",city:"Kinshasa"}});
  expect((await FrenchHotelRoute({params:Promise.resolve({lang:"fr"}),searchParams})).props).toMatchObject({locale:"fr",search:{query:"Jardin",city:"Kinshasa"}});
});
it("requests backend hotel filters and renders the returned page",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({items:[hotel],count:1})));
  const html=renderToStaticMarkup(await HotelCollectionPage({locale:"fr",search:{query:"Jardin",city:"Kinshasa"}}));
  expect(html).toContain("Hôtel du Jardin");
  expect(html).not.toContain('href="/fr/shida/hotels/lac"');
  expect(html).toContain("1 hôtel affiché");
  expect(vi.mocked(fetch).mock.calls[0][0]).toContain("/api/public/shida/hotels?query=Jardin&city=Kinshasa");
  expect(html).toContain('href="/fr/shida/hotels/hotel-jardin"');
});
it("retains a search and reset action when no hotels match",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({items:[],count:0})));
  const html=renderToStaticMarkup(await HotelCollectionPage({locale:"en",search:{query:"missing"}}));
  expect(html).toContain("No hotels match your search.");
  expect(html).toContain("0 hotels shown");
  expect(html).toContain('value="missing"');
  expect(html).toContain('class="mp-clear-filters" href="/shida/hotels"');
});
