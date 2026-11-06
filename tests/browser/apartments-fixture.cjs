// Isolated browser fixture. This preload is never imported by the application.
const {appendFileSync,mkdirSync,writeFileSync}=process.getBuiltinModule('node:fs');
mkdirSync('test-results',{recursive:true});writeFileSync('test-results/apartments-fetch-metrics.jsonl','');
const original = global.fetch;
const listing = {public_ref:'APT_fixture',slug:'limete-fixture',title:'Appartement 1 chambre — Limete',city:'Kinshasa',area:null,commune:'Limete',quartier:'Quartier résidentiel',rent:250,currency:'USD',number_of_rooms:2,bedroom_count:1,size_sqm:65,amenities:{water:true,electricity:true,kitchen:true,bathroom:true},description:'Appartement dans un quartier calme de Limete. Un salon, une cuisine et une salle de bain. Description de démonstration pour validation locale.',property_type:'apartment',availability_state:'available',images:Array.from({length:5},(_,i)=>({url:`https://api.nihiloba.com/api/apartments/photos/APF_${String(i+1).padStart(32,"0")}`,alt:`Controlled layout fixture ${i+1}`})),owner:null,advertiser_role:'owner',public_detail_url:'https://nihiloba.com/shida/appartements/limete-fixture',visit_url:'https://wa.me/243800000099?text=apartment_fixture'};
global.fetch = async(input, init) => {
 const url = new URL(typeof input === 'string' ? input : input.url || String(input));
 if(url.hostname === 'api.nihiloba.com') {
  appendFileSync('test-results/apartments-fetch-metrics.jsonl',JSON.stringify({path:url.pathname})+'\n');
  const data = url.pathname === '/api/public/shida/apartments/limete-fixture' ? listing : undefined;
  return new Response(JSON.stringify(data ?? {}), {status:data ? 200 : 404,headers:{'Content-Type':'application/json'}});
 }
 return original(input, init);
};
