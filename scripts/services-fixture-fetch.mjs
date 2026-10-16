// Explicit, process-local public fixtures. Never imported by application code.
const fixtureOrigin=process.env.SHIDA_API_BASE_URL;
if(process.env.SERVICES_FIXTURE_MODE!=="1"||!/^https:\/\/services-[a-f0-9-]{36}\.fixture\.invalid$/.test(fixtureOrigin??""))throw new Error("Services fixtures require the isolated test configuration");
const originalFetch=globalThis.fetch;
const location={country_code:"CD",city:"Kinshasa",commune:"Gombe",quartier:null,area:null,address_visibility:"private",address:null,landmark:null};
const provider={public_ref:"SVI_fixture",slug:"atelier-kin",name:"Atelier Kin",profile_image:null};
const service={public_ref:"SVC_fixture",slug:"home-repair",provider,service_name:"Home repair",category:"repair_maintenance",short_description:"Careful repairs for the small things that make a home.",duration_minutes:60,starting_price:{public_ref:"SPK_fixture",name:"Standard visit",duration_minutes:60,price:"25",currency:"USD",description:null,booking_url:null},location,location_type:"public_place",external_intervention_available:true,availability_mode:"flexible",rating:{average_rating:null,rating_count:0},image_preview:null,public_detail_url:"https://nihiloba.com/shida/services/home-repair",booking_url:null};
const items=[service,{...service,public_ref:"SVC_clean",slug:"cleaning",service_name:"Home cleaning",category:"cleaning",short_description:"A fresh start for your space.",starting_price:{...service.starting_price,price:"35000",currency:"CDF"}},{...service,public_ref:"SVC_tutor",slug:"tutoring",service_name:"Private tutoring",category:"education_training",short_description:"Learn at your own pace, with individual support."}].map(item=>({...item,public_detail_url:`https://nihiloba.com/shida/services/${item.slug}`}));
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==="string"||input instanceof URL?input:input.url);
 if(url.origin!==fixtureOrigin){
  if(["localhost","127.0.0.1"].includes(url.hostname))return originalFetch(input,init);
  throw new Error("External network disabled in Services fixture process");
 }
 const path=url.pathname.replace(/\/$/,"");
 if(path==="/api/public/shida/services"){
  if(url.searchParams.get("query")==="failure")return Response.json({detail:"unavailable"},{status:503});
  const selected=url.searchParams.get("query")==="empty"?[]:items.filter(row=>!url.searchParams.get("category")||row.category===url.searchParams.get("category"));
  return Response.json({items:selected,count:selected.length,total:selected.length,page:1,page_size:12});
 }
 if(path.startsWith("/api/public/shida/services/providers/"))return Response.json({...provider,location,categories:["repair_maintenance","cleaning","education_training"],service_count:3,rating:service.rating,services:items});
 if(path.endsWith("/availability"))return Response.json({service_ref:service.public_ref,availability_mode:"flexible",requested_time_requires_provider_confirmation:true,from:"2026-10-16",to:"2026-11-16",slots:[],booking_url:null});
 if(path.endsWith("/reviews"))return Response.json({items:[],count:0,total:0,page:1,page_size:10});
 if(path.startsWith("/api/public/shida/services/")){const item=items.find(row=>path.endsWith('/'+row.slug));return item?Response.json({...item,description:item.short_description,offerings:[],images:[],social_link:null,completion_mode:null,availability_endpoint:path+"/availability"}):Response.json({detail:"missing"},{status:404});}
 return Response.json({detail:"fixture_unavailable"},{status:401});
};
