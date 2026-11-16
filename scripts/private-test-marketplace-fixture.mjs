// Isolated browser/build fixture; never imported by the application.
import './marketplace-style-fixture-fetch.mjs';
const fallback=globalThis.fetch;
const token='synthetic-private-marketplace-browser-token';
const item=(privateView)=>({public_ref:privateView?'WNP_PRIVATE':'WNP_PUBLIC',slug:privateView?'WNP_PRIVATE':'WNP_PUBLIC',name:privateView?'Private rehearsal product':'Ordinary public product',description:'Synthetic browser fixture',category:'home_equipment',price:'1000',currency:'CDF',price_negotiable:false,available_stock:5,has_variants:false,variants:[],images:[],public_detail_url:`https://nihiloba.com/shida/wenze/products/${privateView?'WNP_PRIVATE':'WNP_PUBLIC'}`,store:null,fulfillment:{methods:['pickup'],delivery:null}});
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin!==process.env.SHIDA_API_BASE_URL)return fallback(input,init);
 const path=url.pathname.replace(/\/$/,'');const cookie=new Headers(init?.headers).get('cookie')||'';
 if(path==='/api/dashboard/me')return cookie===`shida_dashboard_session=${token}`?Response.json({user:{display_name:'Synthetic Tester',account_type:'personal',test_data:true}}):Response.json({detail:'unauthorized'},{status:401});
 if(path==='/api/dashboard/logout')return Response.json({ok:true});
 if(path.startsWith('/api/dashboard/personal/')&&cookie===`shida_dashboard_session=${token}`){
  if(path.startsWith('/api/dashboard/personal/wenze-buyer/relations/'))return Response.json({saved:false,following:false});
  if(path==='/api/dashboard/personal/security/profile')return Response.json({revision:1,values:{preferred_language:'en'}});
  return Response.json({detail:'fixture_unavailable'},{status:404});
 }
 const privateView=path.startsWith('/api/dashboard/test-marketplace/');
 if(privateView&&cookie!==`shida_dashboard_session=${token}`)return Response.json({detail:'forbidden'},{status:403});
 const normal=path.replace('/api/dashboard/test-marketplace','/api/public/shida');
 if(normal==='/api/public/shida/wenze/products')return Response.json({items:[item(privateView)],count:1,total:1,page:1,page_size:20,has_more:false,next_cursor:null});
 if(normal.startsWith('/api/public/shida/wenze/products/'))return normal.endsWith('/'+item(privateView).public_ref)?Response.json(item(privateView)):Response.json({detail:'not_found'},{status:404});
 if(privateView)return Response.json({detail:'fixture_unavailable'},{status:404});
 return fallback(input,init);
};
