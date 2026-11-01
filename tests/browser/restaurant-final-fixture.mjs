// Controlled records in a dedicated local process. Never imported by the app.
process.env.RESTAURANT_FIXTURE_MODE='1';
process.env.SHIDA_API_BASE_URL='https://restaurant-fixture.invalid';
await import('../../scripts/restaurants-fixture-fetch.mjs');
const base=globalThis.fetch;
const {restaurant,unit,monetary,collection,menu}=await import('../fixtures/restaurants.mjs');
const parents=[{...restaurant,name:'Controlled Malewa',public_ref:'RST-TEST1',hours:{...restaurant.hours,status:'open'},service_modes:['Sur place']},{...restaurant,name:'Controlled Restaurant',type_label:'Restaurant',public_ref:'RST-SECOND',hours:{...restaurant.hours,status:'closed'},service_modes:['À emporter']}];
const items=ref=>[{...unit,public_ref:ref==='RST-TEST1'?'ITM-UNIT':'ITM-SECOND',establishment_ref:ref,name:ref==='RST-TEST1'?'Fufu':'Ntaba'},{...monetary,establishment_ref:ref,availability:'available',name:'Pondu'},{...unit,establishment_ref:ref,public_ref:'ITM-SOLD',availability:'sold_out',name:'Sold out dish'}];
globalThis.fetch=async(input,init)=>{
 const u=new URL(typeof input==='string'||input instanceof URL?input:input.url),p=u.pathname;
 if(u.hostname!=='restaurant-fixture.invalid')return base(input,init);
 if(p.endsWith('/restaurants')){
  const term=u.searchParams.get('query')||u.searchParams.get('dish')||'',page=Number(u.searchParams.get('page')||1),size=Number(u.searchParams.get('page_size')||6);
  if(term==='failure'||(term==='partial'&&u.searchParams.has('dish')))return new Response('{}',{status:503});
  if(term==='slow')await new Promise(r=>setTimeout(r,1500));
  let rows=term==='empty'?[]:parents.filter(row=>!u.searchParams.get('food_type')||row.type_label.toLowerCase()===u.searchParams.get('food_type'));
  if(u.searchParams.has('dish'))rows=rows.map(row=>({...row,dish_matches:{items:items(row.public_ref).filter(item=>item.name.toLowerCase().includes(term.toLowerCase()))}})).filter(row=>row.dish_matches.items.length);
  return Response.json({...collection(rows,page,rows.length,size),service_mode_options:['Sur place','À emporter']});
 }
 const parent=parents.find(row=>p.includes('/'+row.public_ref));
 if(parent){
  if(p.endsWith('/reviews'))return Response.json(collection([]));
  if(p.endsWith('/menu'))return Response.json({...menu,...collection(items(parent.public_ref)),establishment_ref:parent.public_ref});
  if(p.includes('/menu/')){const ref=p.split('/').at(-1),item=items(parent.public_ref).find(item=>item.public_ref===ref);return item?Response.json(item):new Response('{}',{status:404});}
  if(p.endsWith('/'+parent.public_ref))return Response.json(parent);
 }
 return base(input,init);
};
