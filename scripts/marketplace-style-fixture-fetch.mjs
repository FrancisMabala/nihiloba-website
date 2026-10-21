// Browser-only projections. Never imported by application code.
import './services-fixture-fetch.mjs';
import {restaurant,collection,menu,actions} from '../tests/fixtures/restaurants.mjs';
const servicesFetch=globalThis.fetch;
const apartment={public_ref:'APT_STYLE',slug:'bright-flat',title:'Appartement lumineux',city:'Kinshasa',commune:'Gombe',rent:500,currency:'USD',number_of_rooms:2,description:'Données de démonstration',property_type:'apartment',availability_state:'available',images:[],public_detail_url:'https://nihiloba.com/shida/appartements/bright-flat'};
const hotel={public_ref:'HOT_STYLE',slug:'hotel-kin',name:'Hôtel Kin',city:'Kinshasa',description:'Données de démonstration',room_types:[{name:'Standard',price:80,currency:'USD',rental_period:'night',capacity:2,total_rooms:4}],public_detail_url:'https://nihiloba.com/shida/hotels/hotel-kin'};
const store={public_ref:'WNZ_STYLE',slug:'atelier-kin',name:'Atelier Kin',category:'fashion_clothing',city:'Kinshasa',description:'Données de démonstration',public_detail_url:'https://nihiloba.com/shida/wenze/atelier-kin'};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url),p=url.pathname.replace(/\/$/,'');
 if(url.origin!==process.env.SHIDA_API_BASE_URL)return servicesFetch(input,init);
 if(p==='/api/public/shida/apartments')return Response.json({...collection([apartment],1,1,12),filters:{property_types:['apartment']}});
 if(p==='/api/public/shida/apartments/bright-flat')return Response.json(apartment);
 if(p==='/api/public/shida/hotels')return Response.json(collection([hotel]));
 if(p==='/api/public/shida/hotels/hotel-kin')return Response.json(hotel);
 if(p==='/api/public/shida/wenze/stores')return Response.json(collection([store]));
 if(p==='/api/public/shida/wenze/stores/atelier-kin')return Response.json({...store,products:[]});
 if(p==='/api/public/shida/wenze/products')return Response.json({...collection([]),has_more:false,next_cursor:null});
 if(p==='/api/public/shida/jobs')return Response.json({items:[],pagination:{page:1,page_size:12,total_items:0,total_pages:0}});
 if(p==='/api/public/shida/restaurants')return Response.json(collection([restaurant]));
 if(p.startsWith('/api/public/shida/restaurants/'))return Response.json(p.endsWith('/menu')?menu:p.endsWith('/entity-actions')?actions:restaurant);
 return servicesFetch(input,init);
};
