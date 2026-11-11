import { JobEmployerPage, jobEmployerMetadata } from "../../../../../../components/shida/jobs";
import { isServiceLocale } from "../../../../../../lib/services-i18n";

export async function generateMetadata({params}:{params:Promise<{lang:string;employer:string}>}){const {lang,employer}=await params;return jobEmployerMetadata(isServiceLocale(lang)?lang:"en",employer);}
export default async function Page({params}:{params:Promise<{lang:string;employer:string}>}){const {lang,employer}=await params;return <JobEmployerPage locale={isServiceLocale(lang)?lang:"en"} slug={employer}/>;}
