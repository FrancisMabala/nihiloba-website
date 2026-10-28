import './refinement-fixture-fetch.mjs';
const previous=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin===process.env.SHIDA_API_BASE_URL&&url.pathname==='/api/public/shida/wenze/products/refine-0')return Response.json({public_ref:'WNP_REFINE0',slug:'refine-0',name:'Product 1',description:'Synthetic test product',category:'phones_electronics',price:'15',currency:'USD',price_negotiable:false,available_stock:2,has_variants:true,variant_type:'size',variants:[{public_ref:'WNV_M',label:'M',variant_type:'size',available_stock:2,stock_quantity:2,is_available:true,buy_url:null}],images:[],public_detail_url:'https://nihiloba.com/shida/wenze/products/refine-0',buy_url:null,store:null,fulfillment:{methods:['pickup'],delivery:null}});
 return previous(input,init);
};
