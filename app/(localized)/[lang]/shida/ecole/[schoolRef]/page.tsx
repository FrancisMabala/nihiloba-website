import { notFound } from 'next/navigation';
import { getPublicSchool } from '@/app/services/shida/schools';
import { SchoolDetail } from '@/app/components/shida/school-detail';
import type { SchoolEntryLocale } from '@/app/components/shida/school-entry';

type Props={params:Promise<{lang:string;schoolRef:string}>};
const valid=(value:string):value is SchoolEntryLocale=>['en','fr','ln','sw'].includes(value);
export async function generateMetadata({params}:Props){const {lang,schoolRef}=await params;if(!valid(lang))notFound();const result=await getPublicSchool(schoolRef,lang);return result.kind==='found'?{title:`${result.school.name} | SHIDA École`,description:result.school.description.slice(0,160),robots:{index:true,follow:true}}:{title:'SHIDA École',robots:{index:false,follow:false}};}
export default async function Page({params}:Props){const {lang,schoolRef}=await params;if(!valid(lang))notFound();const result=await getPublicSchool(schoolRef,lang);if(result.kind==='missing')notFound();return <SchoolDetail locale={lang} result={result}/>;}
