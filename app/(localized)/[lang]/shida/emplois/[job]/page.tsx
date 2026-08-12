import { JobDetailPage, jobMetadata } from "../../../../../components/shida/jobs";
import { isLocale } from "../../../../../lib/i18n";

export async function generateMetadata({params}:{params:Promise<{lang:string;job:string}>}){const {lang,job}=await params;return jobMetadata(isLocale(lang)?lang:"en",job);}
export default async function Page({params}:{params:Promise<{lang:string;job:string}>}){const {lang,job}=await params;return <JobDetailPage locale={isLocale(lang)?lang:"en"} slug={job}/>;}
