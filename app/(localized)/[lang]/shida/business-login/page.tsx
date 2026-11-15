import {BusinessLogin} from '@/app/components/shida/business-login';
import {notFound} from 'next/navigation';
export const metadata={title:'SHIDA Business',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!['fr','en','ln','sw'].includes(lang))notFound();return <BusinessLogin locale={lang as 'fr'|'en'|'ln'|'sw'}/>;}
