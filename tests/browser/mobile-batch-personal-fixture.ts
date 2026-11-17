import {type Page} from '@playwright/test';
const longName='Délégation de l’Union européenne en République démocratique du Congo';
export async function fixture(page:Page){
 // Next's development evaluator needs eval; only relax the test document response on loopback.
 if(process.env.SHIDA_BROWSER_BASE?.startsWith('http://127.0.0.1:'))await page.route('**/shida/space**',async route=>{if(route.request().resourceType()!=='document')return route.continue();const response=await route.fetch(),headers={...response.headers()};delete headers['content-security-policy'];await route.fulfill({response,headers});});
 const state={enabled:false,fail:false,empty:false,draft:true,writes:[] as string[]};
 await page.route('**/api/**',async route=>{
  const r=route.request(),url=new URL(r.url()),p=url.pathname.replace(/\/$/,''),send=(json:unknown,status=200)=>route.fulfill({json,status});
  if(r.method()!=='GET'){state.writes.push(p);if(state.fail)return send({},503);}
  const companies=[longName,'SERVTEC'].map((name,i)=>({relation_ref:'REL_'+String(i+1).repeat(64),kind:'organization_directory',reference:'ORGDIR_'+i,employer_ref:'ORGDIR_'+i,name,available:true,notifications:state.enabled,management_status:'shida_created',open_job_count:i+1}));
  if(p.endsWith('/employment/session'))return send({binding:'a'.repeat(64),user:{display_name:'Synthetic owner'}});
  if(p.endsWith('/personal/transactions'))return send({counts:{all:0,orders:0,requests:0,documents:0},items:[],documents:[],page:1,page_size:10,has_more:false});
  if(p.endsWith('/employment/applications'))return send({applications:[],total:0,has_more:false});
  if(p.endsWith('/personal/candidate')){if(r.method()==='POST'&&r.postDataJSON().action==='cancel')state.draft=false;return send({profiles:[],progress:state.draft?[{public_ref:'DRF_one',revision:1,profile_type:'professional',state:'active',values:{}}]:[],metadata:{categories:[],required:{professional:[],occasional_work:[]}}});}
  if(p.endsWith('/following'))return send({items:companies,total:2,page:1,has_more:false});
  if(p.endsWith('/saved'))return send({items:[],total:0,page:1,has_more:false});
  if(p.endsWith('/notifications')&&r.method()!=='GET'){state.enabled=r.postDataJSON().enabled;return send({enabled:state.enabled});}
  if(p.endsWith('/delivery-channel'))return send({channel:'whatsapp',email_state:'ready',masked_email:'a***@example.test'});
  if(p.endsWith('/alerts'))return send({profile_count:1,enabled_count:0});
  if(p.endsWith('/personal/job-offer'))return send({rows:state.empty?[]:[{type:'job',reference:'JOB_one',title:'Aide ménagère',status:'open',location:'Kinshasa · Kintambo',count:0},{type:'job',reference:'PJO_one',title:null,status:'draft'},{type:'article',reference:'PRD_one',title:'Lampe rechargeable',status:'online',price:'45000',currency:'CDF'},{type:'service',reference:'SVC_one',title:'Réparation à domicile',status:'available',location:'Limete',count:0}]});
  if(p.endsWith('/quick-sell'))return send({store:{public_ref:'WS_one',revision:1,city:'Kinshasa',name:'Personal',delivery_areas:[],order_ready:true}});
  if(p.endsWith('/stores'))return send({stores:[{public_ref:'WS_shop',name:'Boutique indépendante',selling_mode:'shop'}],product_categories:[{code:'home',labels:{fr:'Maison',en:'Home',ln:'Ndako',sw:'Nyumba'}}]});
  if(p.endsWith('/products'))return send({products:state.empty?[]:[{public_ref:'PRD_one',revision:1,name:'Lampe rechargeable',price:'45000',currency:'CDF',category:'home',condition:'used',description:'Long description',visible:'true',status:'active',quick_sell_state:'available',available_stock:1,committed_quantity:0,photos:[]}],next_offset:null});
  if(p.endsWith('/quick-sell-drafts'))return send({drafts:[],next_offset:null});
  if(p.endsWith('/plan'))return send({active_products:1,active_product_limit:10});
  if(p.endsWith('/security/profile'))return send({revision:'fixture',values:{personal_name:'Synthetic owner',city:'Kinshasa',country_code:'CD',area:'Gombe'},primary_phone:{masked:'•••• 0001',verified:true},neighborhood:'Gombe'});
  if(p.endsWith('/security'))return send({email:null,email_ready_at:null,passkeys:[],protected:false});
  if(p.endsWith('/notifications/count'))return send({unread_count:0});
  if(p.includes('/notifications'))return send({items:[],next_cursor:null});
  if(p.endsWith('/security/navigation'))return send({markets:['wenze'],organization_management:false});
  if(p.endsWith('/personal/restaurants'))return send({items:[],total:0});
  if(p.endsWith('/personal/services'))return send({profiles:[]});
  return send({});
 });return state;
}
