import {serviceLocalInput,shiftDay} from "./service-time";

export type FinanceTab="overview"|"receipts"|"expenses"|"reports";
export type Job={in_period:boolean;ref:string;name:string;status:string;service:string;billed:string;applied:string;outstanding:string;margin:string;costs:Record<string,string>};
export type Entry={frequency?:"once"|"monthly";kind:string;label:string;amount:string;day:string;ref:string;source:string;job:string|null;service:string|null;method:string|null;category:string|null;original:string|null};
export type Due={ref:string;due:string;amount:string;label:string;category:string;job:string|null;service:string|null;method:string;currency:string};
export type Day={day:string;billed:string;received:string;spent:string};
export type Report={start:string;end:string;currency:string;totals:Record<string,string>;days:Day[];entries:Entry[];dues:Due[];
  methods:Record<string,string>;categories:Record<string,string>;jobs:Job[];previous:string;previous_end:string;previous_received:string;
  advances:{ref:string;label:string;remaining:string}[];closes:{ref:string;mode:string;day:string;start:string;note:string;snapshot:Record<string,unknown>;adjusted:boolean}[]};
export type DraftKind="expense"|"schedule_edit"|"schedule_stop"|"receipt"|"advance"|"apply"|"material"|"close";
export type Draft={kind:DraftKind;source?:string;due?:Due;label?:string};
export type Offering={public_ref:string;service_name:string;category?:string};
export function localToday(){return serviceLocalInput(new Date().toISOString()).slice(0,10);}
export function period(value:string, today=localToday()){
  const weekday=(new Date(today+"T12:00:00Z").getUTCDay()+6)%7;
  const start=value==="month"?today.slice(0,7)+"-01":value==="week"?shiftDay(today,-weekday):today;
  const prevMonth=shiftDay(start,-1).slice(0,7)+"-01";
  return {start,end:today,previous:value==="month"?prevMonth:value==="week"?shiftDay(start,-7):shiftDay(start,-1)};
}
export function exportDays(report:Report,labels:string[],total:string){
  // All exported cells contain dates, translations or canonical numeric amounts.
  const lines=[labels,...report.days.map(d=>[d.day,d.billed,d.received,d.spent]),
    [total,...["billed","received","spent"].map(k=>report.totals[k])]];
  const blob=new Blob(["\uFEFF"+lines.map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url;a.download="services-"+report.start+"-"+report.end+"-"+report.currency+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
