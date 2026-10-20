import { WenzeCatalog } from "../../../../components/shida/wenze-catalog";
export const metadata={title:"Products | Wenze by SHIDA",robots:{index:false,follow:true}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  return <WenzeCatalog locale="en" raw={await searchParams}/>;
}
