// Isolated responsive UI fixtures, never loaded by the application.
import './marketplace-style-fixture-fetch.mjs';
const prior=globalThis.fetch;
const products=Array.from({length:5},(_,i)=>({public_ref:`WNP_REFINE${i}`,slug:`refine-${i}`,name:i===1?'A very long product name with detailed specifications and an extraordinarilylongunbrokenwordfortesting':'Product '+(i+1),category:i%2?'fashion_clothing':'phones_electronics',price:i===3?null:String(15+i),currency:'USD',price_negotiable:false,available_stock:2,has_variants:true,variant_type:'size',variants:[],images:i===2?[{url:'https://res.cloudinary.com/dbrxpvmzp/image/upload/refinement-fixture.png',alt:'Fixture image',display_order:0}]:[],public_detail_url:`https://nihiloba.com/shida/wenze/products/refine-${i}`,buy_url:null,store:null,fulfillment:{methods:[],delivery:null}}));
const job={public_ref:'JOB_REFINE',title:'Operations assistant with a long translated job title',employer:{public_ref:null,name:'Individual poster',identity_type:'individual'},location:{city:'Kinshasa'},status:'active',public_url:'https://nihiloba.com/shida/emplois/JOB_REFINE',apply_label:'View job',short_summary:'Isolated demonstration listing'};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin!==process.env.SHIDA_API_BASE_URL)return prior(input,init);
 const path=url.pathname.replace(/\/$/,'');let response;
 if(path==='/api/public/shida/wenze/products')response=Response.json({items:products.slice(0,url.searchParams.get('query')==='few'?1:5),count:5,has_more:false,next_cursor:null});
 else if(path==='/api/public/shida/jobs')response=Response.json({items:[job],pagination:{page:1,page_size:12,total_items:1,total_pages:1}});
 else response=await prior(input,init);
 if(url.searchParams.get('query')==='empty'&&response.ok){const data=await response.json();return Response.json({...data,items:[],count:0,total:0,pagination:{page:1,page_size:12,total_items:0,total_pages:0}});}
 return response;
};
