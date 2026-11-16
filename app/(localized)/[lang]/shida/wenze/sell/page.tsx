import {redirect} from 'next/navigation';
import {personalArticlesPath} from '@/app/lib/personal-articles-path';
export const dynamic="force-dynamic";
export const metadata={title:"Wenze · Quick Sell",robots:{index:false,follow:false,noarchive:true}};
import {notFound} from "next/navigation";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {lang}=await params;if(!["en","fr","ln","sw"].includes(lang))notFound();redirect(personalArticlesPath(lang as WenzeLocale,await searchParams));}
