import { JobEmployerPage, jobEmployerMetadata } from "../../../../../../components/shida/jobs";
import { isLocale } from "../../../../../../lib/i18n";

export async function generateMetadata({params}:{params:Promise<{lang:string;employer:string}>}){const {lang,employer}=await params;return jobEmployerMetadata(isLocale(lang)?lang:"en",employer);}
export default async function Page({params}:{params:Promise<{lang:string;employer:string}>}){const {lang,employer}=await params;return <JobEmployerPage locale={isLocale(lang)?lang:"en"} slug={employer}/>;}
