// Synthetic browser data only. Not imported by application code.
import './marketplace-style-fixture-fetch.mjs';
import {mobileEmployer,mobileJob} from '../tests/fixtures/emploi-mobile.mjs';
const fallback=globalThis.fetch;
const jobs=['Assistant support informatique','Responsable des installations et de la maintenance des systèmes de communication','Aide à domicile'].map((title,i)=>({public_ref:`JOB_compact${i}`,slug:`compact-${i}`,title,offer_type:i===2?'individual':'enterprise',origin:'direct',status:'published',location:{city:'Kinshasa',display:'Kinshasa'},employer:{public_ref:`ORG_compact${i}`,name:i===0?'Atelier du Fleuve':'Délégation de l’Union européenne en République démocratique du Congo',identity_type:i===2?'individual':'shida_employer'},contract_type:i===2?null:'cdi',work_mode:'onsite',category:'it_telecommunications',public_url:`https://nihiloba.com/fr/shida/emplois/compact-${i}`,application:{mode:'shida',available:true,capability:'shida_application',apply_url:null},relationship_capabilities:{can_save:true,save_target_type:'job',save_target_ref:`JOB_compact${i}`,can_share:true,can_follow_employer:false}}));
const products=['Lampe de bureau rechargeable','Chaise en bois','Savon artisanal','Casque audio'].map((name,i)=>({public_ref:`WNP_compact${i}`,slug:`compact-product-${i}`,name,category:i===2?'beauty_health':'home_equipment',price:String([25000,45000,1500,28000][i]),currency:'CDF',price_negotiable:i===3,images:[],variants:[],public_detail_url:`https://nihiloba.com/fr/shida/wenze/products/compact-product-${i}`,store:{public_ref:'WNZ_STYLE',slug:'atelier-kin',name:'Atelier Kin',city:'Kinshasa',category:'home_equipment',public_detail_url:'https://nihiloba.com/fr/shida/wenze/atelier-kin'}}));
export {jobs,products};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url),path=url.pathname.replace(/\/$/,'');
 if(url.origin!==process.env.SHIDA_API_BASE_URL)return fallback(input,init);
 const employerMatch=path.match(/^\/api\/public\/shida\/jobs\/employers\/(?:mobile-|ORGDIR_mobile)([0-2])$/);
 if(employerMatch)return Response.json(mobileEmployer(Number(employerMatch[1])));
 const jobMatch=path.match(/^\/api\/public\/shida\/jobs\/JOB_mobile([0-2])([0-2])(?:\/preview)?$/);
 if(jobMatch)return Response.json(mobileJob(Number(jobMatch[1]),Number(jobMatch[2])));
 if(url.searchParams.get('query')==='fixture-error')return Response.json({},{status:503});
 if(url.searchParams.get('query')==='fixture-loading')await new Promise(resolve=>setTimeout(resolve,1200));
 const empty=url.searchParams.get('query')==='fixture-empty';
 if(path==='/api/public/shida/jobs/catalogs')return Response.json({job_categories:[{id:'it_telecommunications',label:'Informatique et télécommunications'},{id:'education_training',label:'Éducation et formation'},{id:'other',label:'Autres métiers'}]});
 if(path==='/api/public/shida/jobs'){const items=empty?[]:jobs.filter(row=>!url.searchParams.get('view')||(url.searchParams.get('view')==='individual')===(row.offer_type==='individual'));return Response.json({items,pagination:{page:1,page_size:12,total_items:items.length,total_pages:items.length?1:0}});}
 if(path==='/api/public/shida/wenze/products')return Response.json({items:empty?[]:products,total:empty?0:products.length,count:empty?0:products.length,page:1,page_size:20,has_more:false,next_cursor:null});
 if(path.startsWith('/api/public/shida/wenze/products/'))return Response.json(products.find(row=>path.endsWith(row.slug))??products[0]);
 return fallback(input,init);
};
