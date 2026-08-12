import { JobDetailPage, jobMetadata } from "../../../../components/shida/jobs";

export async function generateMetadata({params}:{params:Promise<{job:string}>}){return jobMetadata("en",(await params).job);}
export default async function Page({params}:{params:Promise<{job:string}>}){return <JobDetailPage locale="en" slug={(await params).job}/>;}
