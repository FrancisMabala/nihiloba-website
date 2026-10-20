import { WenzeCatalog } from "../../../../../components/shida/wenze-catalog";
import { isLocale } from "../../../../../lib/i18n";
export const metadata={title:"Produits | Wenze by SHIDA",robots:{index:false,follow:true}};
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const lang=(await params).lang;
  return <WenzeCatalog locale={isLocale(lang)?lang:"en"} raw={await searchParams}/>;
}
