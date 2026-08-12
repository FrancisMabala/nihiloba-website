import { ServiceCollectionPage, servicesMetadata } from "../../../../components/shida/services";
import { isLocale } from "../../../../lib/i18n";
import { parseServiceSearchParams, type ApartmentRawSearchParams } from "../../../../services/shida/public-client";
export const revalidate=60;
export async function generateMetadata({params}:{params:Promise<{lang:string}>}){const lang=(await params).lang;return servicesMetadata(isLocale(lang)?lang:"en");}
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<ApartmentRawSearchParams>}){const lang=(await params).lang;return <ServiceCollectionPage locale={isLocale(lang)?lang:"en"} search={parseServiceSearchParams(await searchParams)}/>;}
