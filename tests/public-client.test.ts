import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apartmentSearchQuery,
  getApartment,
  getApartmentOwner,
  getApartments,
  getHotel,
  getHotels,
  getWenzeProduct, getWenzeStore, getWenzeStores,
  getService, getServiceAvailability, getServiceProvider, getServiceReviews, getServices, parseServiceSearchParams, serviceSearchQuery,
  getJob, getJobEmployer, getJobs, jobSearchQuery, parseJobSearchParams,
  parseApartmentSearchParams,
  ShidaApiError,
} from "../app/services/shida/public-client";

const owner = {
  public_ref: "AOP-1", slug: "bright-agency", public_name: "Bright Agency", city: "Kinshasa", area: "Gombe",
  active_listing_count: 1, public_detail_url: "https://nihiloba.com/shida/appartements/proprietaires/bright-agency",
};

const apartment = {
  public_ref: "APT-1", slug: "bright-flat", title: "Bright flat", city: "Kinshasa", area: null,
  commune: "Gombe", quartier: null, rent: 500, currency: "USD", number_of_rooms: 2,
  description: "A public description", property_type: "apartment", availability_state: "available",
  images: [{ url: "https://res.cloudinary.com/dbrxpvmzp/image/upload/v1/shida/apartments/a.jpg", alt: "Flat" }],
  owner,
  public_detail_url: "https://nihiloba.com/shida/appartements/bright-flat", visit_url: "https://wa.me/1",
};

const apartmentCollection = { items: [apartment], count: 1, total: 1, page: 1, page_size: 12, filters: { property_types: ["apartment", "studio"] } };

const hotel = {
  public_ref: "HOT-1", slug: "hotel-one", name: "Hotel One", description: "A hotel", country_code: "CD",
  city: "Kinshasa", area: null, commune: "Gombe", quartier: null, address_line: "Public avenue", landmark: null,
  room_types: [{ name: "Standard", price: 80, currency: "USD", rental_period: "night", capacity: 2, total_rooms: 4, image_reference: null, image_references: [], description: null }],
  public_detail_url: "https://nihiloba.com/shida/hotels/hotel-one", booking_url: "https://wa.me/2",
};

afterEach(() => vi.unstubAllGlobals());

describe("SHIDA public client", () => {
  it("parses apartment and hotel collections", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(apartmentCollection), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [hotel], count: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await getApartments()).items[0].title).toBe("Bright flat");
    expect((await getHotels()).items[0].room_types[0].name).toBe("Standard");
  });

  it("serializes every supported apartment filter safely", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(apartmentCollection), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await getApartments({ query: "2 bedrooms", city: "Kinshasa", area: "Gombe", property_type: "apartment", bedrooms: 2, min_price: 300, max_price: 700, page: 2, page_size: 12 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.nihiloba.com/api/public/shida/apartments?query=2+bedrooms&city=Kinshasa&area=Gombe&property_type=apartment&bedrooms=2&min_price=300&max_price=700&page=2&page_size=12",
      expect.any(Object),
    );
  });

  it("omits malformed numeric URL parameters and unsupported property types", () => {
    expect(parseApartmentSearchParams({ bedrooms: "2x", min_price: "-1", max_price: "Infinity", page: "0", page_size: "1000", property_type: "villa", query: [" Gombe ", "ignored"] })).toEqual({ query: "Gombe" });
    expect(apartmentSearchQuery({ query: "Gombe & Limete", page: 2 })).toBe("?query=Gombe+%26+Limete&page=2");
  });

  it("parses owner summaries and profiles while discarding all private fields", async () => {
    const profile = {
      public_ref: owner.public_ref, slug: owner.slug, public_name: owner.public_name, city: owner.city, area: owner.area,
      description: "Public agency description", active_apartment_count: 1, apartments: [{ ...apartment, owner_phone: "+000", private_address: "secret" }],
      public_detail_url: owner.public_detail_url, whatsapp_url: "https://wa.me/private", email: "private@example.com", business_id: 99, user_id: 42,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 })));
    const parsed = await getApartmentOwner("bright-agency-profile-test");
    expect(parsed.public_name).toBe("Bright Agency");
    expect(parsed.apartments[0].owner?.public_name).toBe("Bright Agency");
    for (const privateField of ["whatsapp_url", "email", "business_id", "user_id"]) expect(parsed).not.toHaveProperty(privateField);
    expect(parsed.apartments[0]).not.toHaveProperty("owner_phone");
    expect(parsed.apartments[0]).not.toHaveProperty("private_address");
  });

  it("parses detail responses without retaining extra private fields", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...apartment, owner_phone: "+000", id: 99 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...hotel, business_id: 99 }), { status: 200 })));
    const parsedApartment = await getApartment("detail-private-field-test");
    const parsedHotel = await getHotel("detail-private-field-test");
    expect(parsedApartment).not.toHaveProperty("owner_phone");
    expect(parsedApartment).not.toHaveProperty("id");
    expect(parsedHotel).not.toHaveProperty("business_id");
  });

  it("classifies backend and malformed-response failures", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: "wrong", count: 1 }), { status: 200 })));
    await expect(getApartments()).rejects.toMatchObject({ kind: "unavailable", status: 503 } satisfies Partial<ShidaApiError>);
    await expect(getHotels()).rejects.toMatchObject({ kind: "malformed" } satisfies Partial<ShidaApiError>);
  });

  it("classifies missing and network-failed details without exposing response content", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "private backend text" }), { status: 404 }))
      .mockRejectedValueOnce(new Error("private network details")));
    await expect(getApartment("missing-detail-test")).rejects.toMatchObject({ kind: "not-found", status: 404 });
    await expect(getHotel("network-failure-detail-test")).rejects.toMatchObject({ kind: "unavailable" });
  });

  it("prefers normalized Hotel room image arrays and filters blanks", async () => {
    const normalizedHotel = { ...hotel, room_types: [{
      ...hotel.room_types[0],
      image_reference: "https://res.cloudinary.com/dbrxpvmzp/image/upload/legacy.jpg",
      image_references: [" https://res.cloudinary.com/dbrxpvmzp/image/upload/one.jpg ", "", "https://res.cloudinary.com/dbrxpvmzp/image/upload/two.jpg"],
    }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [normalizedHotel], count: 1 }), { status: 200 })));
    expect((await getHotels()).items[0].room_types[0].image_references).toEqual([
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/one.jpg",
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/two.jpg",
    ]);
  });

  it("accepts an authoritative empty array without reviving a legacy value", async () => {
    const emptyHotel = { ...hotel, room_types: [{ ...hotel.room_types[0], image_reference: "https://res.cloudinary.com/dbrxpvmzp/image/upload/legacy.jpg", image_references: [] }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [emptyHotel], count: 1 }), { status: 200 })));
    expect((await getHotels()).items[0].room_types[0].image_references).toEqual([]);
  });

  it("falls back to newline-separated legacy images only when the normalized field is absent", async () => {
    const legacyRoom = { ...hotel.room_types[0], image_reference: "https://res.cloudinary.com/dbrxpvmzp/image/upload/a.jpg\n\nhttps://res.cloudinary.com/dbrxpvmzp/image/upload/b.jpg" };
    const olderRoom = { ...legacyRoom };
    Reflect.deleteProperty(olderRoom, "image_references");
    const legacyHotel = { ...hotel, room_types: [olderRoom] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [legacyHotel], count: 1 }), { status: 200 })));
    expect((await getHotels()).items[0].room_types[0].image_references).toEqual([
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/a.jpg",
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/b.jpg",
    ]);
  });

  it("parses public Wenze stores and products without retaining seller PII", async () => {
    const product={public_ref:"WNP-1",slug:"dress",name:"Dress",description:null,category:"fashion_clothing",price:"25",currency:"USD",price_negotiable:true,available_stock:3,has_variants:true,variant_type:"size",variants:[{public_ref:"WNV-1",label:"M",variant_type:"size",stock_quantity:2,available_stock:2,is_available:true,buy_url:"https://wa.me/variant-m"},{public_ref:"WNV-2",label:"L",variant_type:"size",stock_quantity:1,available_stock:0,is_available:false,buy_url:null}],images:[{url:"https://res.cloudinary.com/dbrxpvmzp/image/upload/wenze/a.jpg",alt:"Product",display_order:1}],public_detail_url:"https://nihiloba.com/shida/wenze/products/dress",buy_url:"https://wa.me/product",fulfillment:{methods:["delivery"],delivery:{fee_type:"free",fee:"0",currency:"USD",areas:["Gombe"]}}};
    const store={public_ref:"WNZ-1",slug:"mado",name:"Mado",description:null,category:"fashion_clothing",store_type:"online_and_physical",country_code:"CD",city:"Kinshasa",area:"Gombe",commune:null,quartier:null,address:"Commerce 12",landmark:null,products:[product],public_detail_url:"https://nihiloba.com/shida/wenze/mado",whatsapp_url:"https://wa.me/1",order_url:"https://api.nihiloba.com/go/store-order",owner_phone:"private",owner_id:42,fulfillment:{methods:["pickup","delivery"],delivery:{fee_type:"fixed",fee:"5000",currency:"CDF",areas:["Gombe","Lingwala"]}}};
    vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({items:[store],count:1}))).mockResolvedValueOnce(new Response(JSON.stringify(store))).mockResolvedValueOnce(new Response(JSON.stringify({...product,store}))));
    const parsedStore=(await getWenzeStores({city:"Kinshasa",category:"fashion_clothing"})).items[0];expect(parsedStore).not.toHaveProperty("owner_phone");expect(parsedStore).not.toHaveProperty("owner_id");expect(parsedStore).toMatchObject({store_type:"online_and_physical",order_url:"https://api.nihiloba.com/go/store-order"});expect(parsedStore.fulfillment).toEqual({methods:["pickup","delivery"],delivery:{fee_type:"fixed",fee:"5000",currency:"CDF",areas:["Gombe","Lingwala"]}});
    expect((await getWenzeStore("mado-test")).products[0].available_stock).toBe(3);
    const parsed=await getWenzeProduct("dress-test");expect(parsed.store?.name).toBe("Mado");expect(parsed.fulfillment).toEqual({methods:["delivery"],delivery:{fee_type:"free",fee:"0",currency:"USD",areas:["Gombe"]}});expect(parsed.buy_url).toBe("https://wa.me/product");expect(parsed.variants[0].buy_url).toBe("https://wa.me/variant-m");expect(parsed.variants[1]).toMatchObject({label:"L",available_stock:0,is_available:false,buy_url:null});
  });

  it("keeps legacy Wenze responses neutral without inventing pickup support",async()=>{const legacyStore={public_ref:"WNZ-LEGACY",slug:"legacy",name:"Legacy",description:null,category:null,country_code:"CD",city:"Kinshasa",area:null,commune:null,quartier:null,address:null,landmark:null,public_detail_url:"https://nihiloba.com/shida/wenze/legacy",whatsapp_url:null};vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[legacyStore],count:1}))));expect((await getWenzeStores()).items[0]).toMatchObject({store_type:null,fulfillment:{methods:[],delivery:null}})});

  it("parses service marketplace DTOs, availability and filters without retaining private fields", async () => {
    const location={country_code:"CD",city:"Kinshasa",area:null,commune:"Gombe",quartier:null,address_visibility:"private",address:"Private avenue",landmark:"Private landmark"};
    const profileImage={url:"https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/services/provider.jpg",alt:"Patrick"},workImage={url:"https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/services/work.jpg",alt:"Consultation"};
    const summary={public_ref:"SVC-1",slug:"consultation",provider:{public_ref:"SVP-1",slug:"patrick",name:"Patrick",profile_image:profileImage},service_name:"Consultation",category:"health",short_description:"Public summary",duration_minutes:30,starting_price:{public_ref:"SPK-1",name:"Consultation",duration_minutes:30,price:"50000",currency:"CDF",description:null,booking_url:"https://wa.me/package"},location,location_type:"public_place",external_intervention_available:false,availability_mode:"time_slots",rating:{average_rating:4,rating_count:1},image_preview:workImage,public_detail_url:"https://nihiloba.com/shida/services/consultation",booking_url:"https://wa.me/service",private_phone:"secret"};
    const detail={...summary,description:"Full description",offerings:[summary.starting_price],images:[workImage],social_link:"https://example.com",completion_mode:null,availability_endpoint:"/api/public/shida/services/consultation/availability"};
    const provider={public_ref:"SVP-1",slug:"patrick",name:"Patrick",profile_image:profileImage,location,categories:["health"],service_count:1,rating:summary.rating,services:[summary],private_phone:"secret"};
    const availability={service_ref:"SVC-1",availability_mode:"time_slots",requested_time_requires_provider_confirmation:true,from:"2026-08-12",to:"2026-09-11",slots:[{date:"2026-08-12",start_time:"10:30",end_time:"11:00",is_available:true,booking_url:"https://wa.me/exact-slot"}],booking_url:null};
    vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({items:[summary],count:1,total:1,page:1,page_size:12}))).mockResolvedValueOnce(new Response(JSON.stringify(detail))).mockResolvedValueOnce(new Response(JSON.stringify(provider))).mockResolvedValueOnce(new Response(JSON.stringify(availability))));
    const parsedSummary=(await getServices({category:"health"})).items[0];expect(parsedSummary).not.toHaveProperty("private_phone");expect(parsedSummary.location).toMatchObject({address:null,landmark:null});
    const parsedDetail=await getService("service-detail-test");expect(parsedDetail.offerings[0].price).toBe("50000");expect(parsedDetail.images[0]).toEqual(workImage);
    const parsedProvider=await getServiceProvider("provider-detail-test");expect(parsedProvider).not.toHaveProperty("private_phone");expect(parsedProvider.profile_image).toEqual(profileImage);
    expect((await getServiceAvailability("availability-test","2026-08-12","2026-09-11")).slots[0].booking_url).toBe("https://wa.me/exact-slot");
    expect(parseServiceSearchParams({query:" health ",min_rating:"4",page:"0",page_size:"51"})).toEqual({query:"health",min_rating:4});
    expect(serviceSearchQuery({query:"home care",commune:"Gombe",page:2})).toBe("?query=home+care&commune=Gombe&page=2");
  });
  it("requests package-aware availability and parses only anonymized public reviews",async()=>{const availability={service_ref:"SVC-1",offering_ref:"SPK-1",availability_mode:"flexible",requested_time_requires_provider_confirmation:true,slots:[],booking_url:"https://wa.me/package",private_id:99},reviews={items:[{rating:5,comment:"Excellent",reviewer_display:"verified_customer",created_at:"2026-08-10",rater_phone:"private",service_request_id:7}],count:1,total:1,page:1,page_size:10};const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(availability))).mockResolvedValueOnce(new Response(JSON.stringify(reviews)));vi.stubGlobal("fetch",fetchMock);expect((await getServiceAvailability("consultation","2026-08-12","2026-09-11","SPK-1")).booking_url).toBe("https://wa.me/package");const parsed=await getServiceReviews("consultation");expect(parsed.items[0]).toEqual({rating:5,comment:"Excellent",reviewer_display:"verified_customer",created_at:"2026-08-10"});expect(parsed.items[0]).not.toHaveProperty("rater_phone");expect(fetchMock.mock.calls[0][0]).toContain("offering=SPK-1");});

  it("parses the Jobs collection, detail and employer contracts without retaining private fields",async()=>{const employer={public_ref:"EMP_test123",slug:"rawbank",name:"RAWBANK",profile_image:{url:"https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/jobs/rawbank.png",alt:"RAWBANK"},city:"Kinshasa",area:"Gombe",owner_phone:"PRIVATE"},location={country_code:"CD",city:"Kinshasa",area:"Gombe",commune:"Gombe",quartier:null,display:"Gombe, Kinshasa",exact_address:"PRIVATE"},summary={public_ref:"JOB_test123",slug:"it-support-rawbank",title:"IT Support Engineer",employer,location,description_preview:"Support users and systems.",compensation:"500 USD",published_at:"2026-08-12T10:00:00",status:"open",public_url:"https://nihiloba.com/shida/emplois/it-support-rawbank",apply_url:"https://wa.me/123?text=opaque",apply_label:"Apply on SHIDA",poster_id:99,recruiter_phone:"PRIVATE"},detail={...summary,description:"Full public description",requirements_document:{available:true,url:null,storage_path:"PRIVATE"},public_social_link:"https://www.linkedin.com/company/rawbank",candidate_phone:"PRIVATE"},profile={...employer,description:"Public employer description",open_job_count:1,jobs:[summary],business_owner_id:7};const collection={items:[summary],pagination:{page:2,page_size:12,total_items:13,total_pages:2},candidate_names:["PRIVATE"]};const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(collection))).mockResolvedValueOnce(new Response(JSON.stringify(detail))).mockResolvedValueOnce(new Response(JSON.stringify(profile)));vi.stubGlobal("fetch",fetchMock);const jobs=await getJobs({query:"support",city:"Kinshasa",commune:"Gombe",page:2,page_size:12});expect(jobs.pagination).toEqual({page:2,page_size:12,total_items:13,total_pages:2});expect(jobs.items[0].public_ref).toBe("JOB_test123");expect(jobs.items[0]).not.toHaveProperty("poster_id");expect(jobs.items[0].employer).not.toHaveProperty("owner_phone");expect(jobs.items[0].location).not.toHaveProperty("exact_address");const parsedJob=await getJob("job-contract-test");expect(parsedJob.requirements_document).toEqual({available:true,url:null});expect(parsedJob).not.toHaveProperty("candidate_phone");const parsedEmployer=await getJobEmployer("employer-contract-test");expect(parsedEmployer.jobs[0].title).toBe("IT Support Engineer");expect(parsedEmployer).not.toHaveProperty("business_owner_id");expect(fetchMock.mock.calls[0][0]).toContain("query=support&city=Kinshasa&commune=Gombe&page=2&page_size=12");});

  it("sanitizes Jobs search parameters and rejects malformed public identities",async()=>{expect(parseJobSearchParams({query:[" accountant ","ignored"],city:"Kinshasa",page:"0",page_size:"51",commune:"Gombe"})).toEqual({query:"accountant",city:"Kinshasa",commune:"Gombe"});expect(jobSearchQuery({query:"barista & café",area:"Gombe",page:3})).toBe("?query=barista+%26+caf%C3%A9&area=Gombe&page=3");vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[{public_ref:"12",slug:"bad",title:"Bad",employer:{public_ref:"1",slug:"bad",name:"Bad",profile_image:null,city:null,area:null},location:{country_code:null,city:null,area:null,commune:null,quartier:null,display:null},description_preview:null,compensation:null,published_at:null,status:"open",public_url:"https://nihiloba.com",apply_url:null,apply_label:{fr:"Postuler",en:"Apply"}}],pagination:{page:1,page_size:20,total_items:1,total_pages:1}}))));await expect(getJobs()).rejects.toMatchObject({kind:"malformed"});});
});
