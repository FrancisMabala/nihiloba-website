"use client";
import {useParams} from "next/navigation";
import {isServiceLocale} from "../../../../lib/services-i18n";
import {restaurantCopy} from "../../../../lib/restaurant-i18n";
export default function Loading(){
 const {lang}=useParams<{lang:string}>();
 return <section className="section"><div className="container" role="status" aria-busy="true">{restaurantCopy[isServiceLocale(lang)?lang:"en"].loading}</div></section>;
}
