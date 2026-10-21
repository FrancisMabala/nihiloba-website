"use client";
import type {MarketplaceLocale} from "./marketplace-account-copy";
import {servicesAccountCopy} from "../../lib/services-account-navigation";
import {useServicesProviderAccess} from "./use-services-provider-access";

export function ServicesAccountProviderLink({locale}:{locale:MarketplaceLocale}){
 const access=useServicesProviderAccess(),t=servicesAccountCopy[locale];
 if(access==="unavailable")return null;
 return <a href={`${locale==="en"?"":`/${locale}`}/shida/seller/services`}><span>{access==="provider"?t.provider:t.offer}</span><span aria-hidden="true">→</span></a>;
}
