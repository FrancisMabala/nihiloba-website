import {ApartmentOwner} from '../../../../../components/shida/apartment-owner';
import {isServiceLocale} from '../../../../../lib/services-i18n';
export const metadata={title:'SHIDA Appartements',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;return <ApartmentOwner locale={isServiceLocale(lang)?lang:'fr'}/>;}
