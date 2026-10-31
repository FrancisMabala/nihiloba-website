// Isolated public records, never written to a backend.
const original = global.fetch;
const fulfillment={methods:['pickup','delivery'],delivery:{fee_type:'fixed',fee:'1000',currency:'CDF',areas:['Lemba']}};
const shop={public_ref:'WNZ_FIXTURE',slug:null,name:'Controlled Boutique',description:'Isolated review shop.',category:'fashion_clothing',store_type:'online_and_physical',country_code:'CD',city:'Kinshasa',area:'Lemba',commune:'Lemba',quartier:null,address:null,landmark:null,public_detail_url:'https://nihiloba.com/shida/wenze/WNZ_FIXTURE',whatsapp_url:null,order_url:null,profile_image:null,fulfillment};
const products=[['WNP_SHIRT','Cotton shirt','fashion_clothing','15000'],['WNP_PHONE','Refurbished phone','phones_electronics','350000'],['WNP_BAG','Everyday bag','fashion_clothing','25000'],['WNP_AUDIO','Wireless audio','phones_electronics','45000']].map(([public_ref,name,category,price])=>({public_ref,name,category,price,slug:null,description:'Controlled product description.',condition:'like_new',currency:'CDF',price_negotiable:false,available_stock:3,has_variants:false,variant_type:null,variants:[],images:[],public_detail_url:`https://nihiloba.com/shida/wenze/products/${public_ref}`,buy_url:null,store:shop,fulfillment}));
global.fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input.url||String(input));if(url.hostname==='api.nihiloba.com'){
 let data;if(url.pathname==='/api/public/shida/wenze/products'){const items=url.searchParams.get('query')==='missing'?[]:products.filter(p=>!url.searchParams.get('category')||p.category===url.searchParams.get('category'));data={items,count:items.length,has_more:false,next_cursor:null};}
 else if(url.pathname==='/api/public/shida/wenze/stores')data={items:[shop],count:1,has_more:false,next_cursor:null};
 else if(url.pathname==='/api/public/shida/wenze/stores/WNZ_FIXTURE')data={...shop,products};
 else if(url.pathname.startsWith('/api/public/shida/wenze/products/'))data=products.find(p=>url.pathname.endsWith(p.public_ref));
 return new Response(JSON.stringify(data??{}),{status:data?200:404,headers:{'Content-Type':'application/json'}});
}return original(input,init);};
