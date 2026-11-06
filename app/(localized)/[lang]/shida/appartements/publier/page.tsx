import {ApartmentCreation} from '../../../../../components/shida/apartment-creation';
import {isServiceLocale} from '../../../../../lib/services-i18n';
export const metadata = {title:'SHIDA Appartements',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{lang:string}>}) {const {lang} = await params;return <ApartmentCreation locale={isServiceLocale(lang) ? lang : 'fr'}/>;}
