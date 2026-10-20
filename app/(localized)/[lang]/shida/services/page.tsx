import { ServiceCollectionPage, servicesMetadata } from "../../../../components/shida/services";
import { isServiceLocale } from "../../../../lib/services-i18n";
import { parseServiceSearchParams, type ApartmentRawSearchParams } from "../../../../services/shida/public-client";
export const revalidate=60;
export async function generateMetadata({params}:{params:Promise<{lang:string}>}){const lang=(await params).lang;return servicesMetadata(isServiceLocale(lang)?lang:"en");}
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<ApartmentRawSearchParams>}){const lang=(await params).lang,locale=isServiceLocale(lang)?lang:"en";return <ServiceCollectionPage locale={locale} search={parseServiceSearchParams(await searchParams)}/>;}
