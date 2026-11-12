"use client";
import {workMatches,type WorkRow,type WorkFilter} from "../../lib/services-work-model";
import {workText} from "../../lib/services-work-copy";
import type {ServicesLocale} from "./services-transaction-copy";
import {SellerWorkspaceIcon} from "./services-workspace-icon";
export function ServicesWorkSummary({requests,reservations,locale,onSelect,disabled,failed}:{requests:WorkRow[]|null;reservations:WorkRow[]|null;locale:ServicesLocale;onSelect:(kind:"requests"|"reservations",filter:WorkFilter)=>void;disabled:boolean;failed:boolean}){
 return <div className="svc-work-summary"><div className="svc-work-kpis">{(["new","quotes","bookings","jobs"] as const).map((filter,index)=>{
  const kind=filter==="new"||filter==="quotes"?"requests":"reservations";
  const source=kind==="requests"?requests:reservations;
  return <button key={filter} type="button" disabled={disabled} onClick={()=>onSelect(kind,filter)} className={`svc-work-kpi ${["blue","amber","green","purple"][index]}`}><SellerWorkspaceIcon name={filter==="bookings"?"calendar":filter==="quotes"?"document":"work"}/><span>{workText(locale,filter)}<strong>{failed?"—":source?source.filter(row=>workMatches(row,filter,kind)).length:"…"}</strong></span></button>;
 })}</div></div>;
}
