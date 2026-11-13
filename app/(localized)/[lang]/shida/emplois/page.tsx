import { JobCollectionPage, jobsMetadata } from "../../../../components/shida/jobs";
import { isServiceLocale } from "../../../../lib/services-i18n";
import { parseJobSearchParams, type ApartmentRawSearchParams } from "../../../../services/shida/public-client";

export const revalidate=60;
export async function generateMetadata({params}:{params:Promise<{lang:string}>}){const lang=(await params).lang;return jobsMetadata(isServiceLocale(lang)?lang:"en");}
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<ApartmentRawSearchParams>}){const lang=(await params).lang;const raw=await searchParams;return <JobCollectionPage initialOffer={typeof raw.offer==="string"?raw.offer:undefined} locale={isServiceLocale(lang)?lang:"en"} search={parseJobSearchParams(raw)}/>;}
