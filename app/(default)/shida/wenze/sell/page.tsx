import {redirect} from 'next/navigation';
import {personalArticlesPath} from '@/app/lib/personal-articles-path';
export const dynamic="force-dynamic";
export const metadata={title:"Wenze · Quick Sell",robots:{index:false,follow:false,noarchive:true}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){redirect(personalArticlesPath('en',await searchParams));}
