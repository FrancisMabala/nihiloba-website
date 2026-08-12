import { ServiceCollectionPage, servicesMetadata } from "../../../components/shida/services";
import { parseServiceSearchParams, type ApartmentRawSearchParams } from "../../../services/shida/public-client";
export const revalidate=60;
export const metadata=servicesMetadata("en");
export default async function Page({searchParams}:{searchParams:Promise<ApartmentRawSearchParams>}){return <ServiceCollectionPage locale="en" search={parseServiceSearchParams(await searchParams)}/>;}
