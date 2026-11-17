import {notFound} from 'next/navigation';
import {MedaMarketplace} from '../../../../components/shida/meda-marketplace';
import {isServiceLocale} from '../../../../lib/services-i18n';
import {medaCopy} from '../../../../lib/meda-copy';
export async function generateMetadata({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!isServiceLocale(lang))notFound();return {title:'SHIDA Meda',description:medaCopy[lang].description};}
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!isServiceLocale(lang))notFound();return <MedaMarketplace locale={lang}/>;}
