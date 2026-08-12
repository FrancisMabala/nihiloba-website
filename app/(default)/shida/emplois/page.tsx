import { JobCollectionPage, jobsMetadata } from "../../../components/shida/jobs";
import { parseJobSearchParams, type ApartmentRawSearchParams } from "../../../services/shida/public-client";

export const revalidate=60;
export const metadata=jobsMetadata("en");
export default async function Page({searchParams}:{searchParams:Promise<ApartmentRawSearchParams>}){return <JobCollectionPage locale="en" search={parseJobSearchParams(await searchParams)}/>;}
