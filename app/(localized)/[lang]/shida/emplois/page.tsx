import { JobCollectionPage, jobsMetadata } from "../../../../components/shida/jobs";
import { isLocale } from "../../../../lib/i18n";
import { parseJobSearchParams, type ApartmentRawSearchParams } from "../../../../services/shida/public-client";

export const revalidate=60;
export async function generateMetadata({params}:{params:Promise<{lang:string}>}){const lang=(await params).lang;return jobsMetadata(isLocale(lang)?lang:"en");}
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<ApartmentRawSearchParams>}){const lang=(await params).lang;return <JobCollectionPage locale={isLocale(lang)?lang:"en"} search={parseJobSearchParams(await searchParams)}/>;}
