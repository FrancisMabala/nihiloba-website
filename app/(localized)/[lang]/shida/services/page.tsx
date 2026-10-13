import { ServiceCollectionPage, servicesMetadata } from "../../../../components/shida/services";
import { isLocale } from "../../../../lib/i18n";
import { parseServiceSearchParams, type ApartmentRawSearchParams } from "../../../../services/shida/public-client";
import Link from "next/link";
export const revalidate=60;
export async function generateMetadata({params}:{params:Promise<{lang:string}>}){const lang=(await params).lang;return servicesMetadata(isLocale(lang)?lang:"en");}
export default async function Page({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<ApartmentRawSearchParams>}){const lang=(await params).lang,locale=isLocale(lang)?lang:"en";const label={fr:"Gérer mes services",en:"Manage my Services",ln:"Tambwisa misala na ngai",sw:"Simamia huduma zangu"}[locale];return <><div className="container"><Link href={`/${locale}/shida/seller/services`}>{label}</Link></div><ServiceCollectionPage locale={locale} search={parseServiceSearchParams(await searchParams)}/></>;}
