import {notFound} from 'next/navigation';
import {AccountDeletionStatus} from '@/app/components/shida/account-deletion-status';
export const metadata={title:'SHIDA · Account',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!['en','fr','ln','sw'].includes(lang))notFound();return <AccountDeletionStatus locale={lang as 'en'|'fr'|'ln'|'sw'}/>;}
