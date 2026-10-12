// Explicitly isolated synthetic photo and responsive-layout fixtures.
import './restaurants-fixture-fetch.mjs';
import { restaurant, unit, monetary, collection, actions } from '../tests/fixtures/restaurants.mjs';
const prior = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.origin !== 'https://restaurant-fixture.invalid') return prior(input, init);
  const id = url.pathname.match(/RST_(PHOTO|NOPHOTO|ONEPHOTO)/)?.[0];
  const photo = name => `https://api.nihiloba.com/api/restaurants/photos/RPH_${name}`;
  const profile = ref => ({ ...restaurant, public_ref: ref, name: 'Chez maman — cuisine du quartier et saveurs de Kinshasa', owning_business: null, establishment_photo: ref === 'RST_NOPHOTO' ? null : {url:photo('cover'),alt:'Synthetic restaurant photo fixture'}, ordering_available:false });
  if (url.pathname.endsWith('/restaurants') && url.searchParams.get('query') === 'photos') return Response.json({...collection(['RST_PHOTO','RST_NOPHOTO','RST_ONEPHOTO'].map(profile)),service_mode_options:[]});
  if (!id) return prior(input,init);
  if (url.pathname.endsWith('/reviews')) return Response.json(collection([],1,0,5));
  if (url.pathname.includes('/entity-actions/')) return Response.json({...actions,public_ref:id,can_save_in_shida:false,can_follow_in_shida:false,link_destination_available:false,menu_share_url:null});
  if (url.pathname.endsWith('/menu')) return Response.json({...collection(Array.from({length:12},(_,i)=>({
    ...(i===2?monetary:unit),public_ref:`RMI_photo_${i}`,establishment_ref:id,
    name:i===0?'Fumbwa ya maman, makayabu et accompagnement au choix selon le marché':i===10?'Jus de gingembre sans alcool':`Pondu ya mboka ${i+1}`,
    description:i%2===0?'Préparé sur place, avec les légumes du jour.':null,
    category:{public_ref:i<8?'RMC_food':'RMC_drinks',name:i<8?'Bilei ya mboka':'Boissons sans alcool',visible:true},
    currency:'CDF',unit_price:i===2?null:'3000.00',sale_unit_label:'assiette',availability:i===3?'sold_out':i===7?'temporarily_unavailable':'available',
    ...(i===2?{amount_mode:'flexible',minimum_amount:'500.00',allowed_amounts:[],amount_step:'100.00'}:{}),
    image_url:id==='RST_NOPHOTO'||id==='RST_ONEPHOTO'&&i!==0?null:photo(`dish_${i}`),
  }))),establishment_ref:id,hours:restaurant.hours});
  return Response.json(profile(id));
};
