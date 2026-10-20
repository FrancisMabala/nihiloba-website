"use client";
import {useParams} from "next/navigation";
import {isServiceLocale} from "../../../../../lib/services-i18n";
import {ServiceDetailLoading} from "../../../../../components/shida/service-loading";

export default function Loading() {
  const {lang}=useParams<{lang:string}>();
  return <ServiceDetailLoading locale={isServiceLocale(lang)?lang:"en"} />;
}
