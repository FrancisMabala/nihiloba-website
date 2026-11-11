import { JobDetailPage, jobMetadata } from "../../../../../components/shida/jobs";
import { isServiceLocale } from "../../../../../lib/services-i18n";

export async function generateMetadata({params}:{params:Promise<{lang:string;job:string}>}){const {lang,job}=await params;return jobMetadata(isServiceLocale(lang)?lang:"en",job);}
export default async function Page({params}:{params:Promise<{lang:string;job:string}>}){const {lang,job}=await params;return <JobDetailPage locale={isServiceLocale(lang)?lang:"en"} slug={job}/>;}
