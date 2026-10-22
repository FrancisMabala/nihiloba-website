import {TransportDiscovery,transportMetadata} from "../../../../components/shida/transport-discovery";
import {isServiceLocale} from "../../../../lib/services-i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}){const {lang}=await params;return transportMetadata(isServiceLocale(lang)?lang:"en");}
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;return <TransportDiscovery locale={isServiceLocale(lang)?lang:"en"}/>;}
