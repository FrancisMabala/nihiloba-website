import { ServiceCollectionPage, servicesMetadata } from "../../../components/shida/services";
import { parseServiceSearchParams, type ApartmentRawSearchParams } from "../../../services/shida/public-client";
import Link from "next/link";
export const revalidate=60;
export const metadata=servicesMetadata("en");
export default async function Page({searchParams}:{searchParams:Promise<ApartmentRawSearchParams>}){return <><div className="container"><Link href="/shida/seller/services">Manage my Services</Link></div><ServiceCollectionPage locale="en" search={parseServiceSearchParams(await searchParams)}/></>;}
