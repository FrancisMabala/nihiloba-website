"use client";
import {useParams} from "next/navigation";
import {isServiceLocale} from "../../../../lib/services-i18n";
export default function Loading(){
 const {lang}=useParams<{lang:string}>();
 const labels={en:"Loading",fr:"Chargement",ln:"Tozali kozwa makambo",sw:"Inapakia"};
 return <div className="candidate-route-loading" role="status" aria-busy="true" aria-label={labels[isServiceLocale(lang)?lang:"en"]}><span/><span/><span/></div>;
}
