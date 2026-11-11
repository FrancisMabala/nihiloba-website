import "./marketplace-style-fixture-fetch.mjs";
import {collection,restaurant} from "../tests/fixtures/restaurants.mjs";
const fixtureFetch=globalThis.fetch;
let retry=false;
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==="string"||input instanceof URL?input:input.url);
 if(url.origin===process.env.SHIDA_API_BASE_URL){
  const path=url.pathname.replace(/\/$/,""),term=url.searchParams.get("query");
  if(path.endsWith("/restaurant-dishes"))return Response.json(collection([]));
  if(path.endsWith("/restaurants")){
   if(term==="retry"&&!retry){retry=true;return new Response(null,{status:503});}
   return Response.json(collection(term==="retry"?[restaurant]:[]));
  }
 }
 return fixtureFetch(input,init);
};
