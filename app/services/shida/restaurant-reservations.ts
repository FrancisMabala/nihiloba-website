import { getRestaurant, type RestaurantLocale } from './restaurants-client';

export async function reservationAvailability(ref:string):Promise<{available:boolean;timezone_name:string|null}> {
  if (!/^RST_[A-Za-z0-9_-]{1,64}$/.test(ref)) return {available:false,timezone_name:null};
  try {
    const base=new URL(process.env.SHIDA_API_BASE_URL??'https://api.nihiloba.com');
    if(base.protocol!=='https:'||base.username||base.password)return {available:false,timezone_name:null};
    const response=await fetch(new URL(`/api/restaurants/${ref}/reservations/availability`,base.origin),{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000)});
    const body=await response.json();
    if(!response.ok||body?.establishment_ref!==ref||typeof body.available!=='boolean')return {available:false,timezone_name:null};
    return {available:body.available,timezone_name:typeof body.timezone_name==='string'?body.timezone_name:null};
  }catch{return {available:false,timezone_name:null};}
}

export async function reservationPageData(locale:RestaurantLocale,ref:string|undefined){
  if(!ref||!/^RST_[A-Za-z0-9_-]{1,64}$/.test(ref))return {};
  try{const [restaurant,availability]=await Promise.all([getRestaurant(locale,ref),reservationAvailability(ref)]);
    return {establishmentRef:restaurant.public_ref,establishmentName:restaurant.name??undefined,
      timezoneName:availability.timezone_name??undefined,available:availability.available};
  }catch{return {};}
}
