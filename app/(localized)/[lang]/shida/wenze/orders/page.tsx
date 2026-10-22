import {WenzeBuyerOrdersPage} from "../../../../../components/shida/wenze-buyer-orders";
import {isLocale} from "../../../../../lib/i18n";
export const metadata={title:"Wenze | NIHILOBA",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{lang:string}>}){
 const {lang}=await params;return <WenzeBuyerOrdersPage locale={lang==="ln"||lang==="sw"?lang:isLocale(lang)?lang:"en"}/>;
}
