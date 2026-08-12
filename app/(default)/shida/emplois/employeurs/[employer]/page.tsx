import { JobEmployerPage, jobEmployerMetadata } from "../../../../../components/shida/jobs";

export async function generateMetadata({params}:{params:Promise<{employer:string}>}){return jobEmployerMetadata("en",(await params).employer);}
export default async function Page({params}:{params:Promise<{employer:string}>}){return <JobEmployerPage locale="en" slug={(await params).employer}/>;}
