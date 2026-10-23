import { notFound } from 'next/navigation';
import { getPublicSchool } from '@/app/services/shida/schools';
import { SchoolDetail } from '@/app/components/shida/school-detail';

type Props={params:Promise<{schoolRef:string}>};
export async function generateMetadata({params}:Props){const {schoolRef}=await params;const result=await getPublicSchool(schoolRef,'en');return result.kind==='found'?{title:`${result.school.name} | SHIDA École`,description:result.school.description.slice(0,160),robots:{index:true,follow:true}}:{title:'SHIDA École',robots:{index:false,follow:false}};}
export default async function Page({params}:Props){const {schoolRef}=await params;const result=await getPublicSchool(schoolRef,'en');if(result.kind==='missing')notFound();return <SchoolDetail locale="en" result={result}/>;}
