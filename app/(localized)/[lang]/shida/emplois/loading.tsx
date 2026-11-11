"use client";
import {useParams} from "next/navigation";
import {isServiceLocale} from "../../../../lib/services-i18n";
import {JobFeedLoading} from "../../../../components/shida/job-feed-loading";
export default function Loading(){
 const {lang}=useParams<{lang:string}>();
 return <JobFeedLoading locale={isServiceLocale(lang)?lang:"en"}/>;
}
