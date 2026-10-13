"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type Locale="fr"|"en"|"ln"|"sw";
type Bucket={billed:string;declared_received:string;outstanding:string;unbilled_receipts:string;declared_excess:string;job_expenses:string;services_overhead:string;recorded_expenses:string;declared_surplus:string};
type Totals={as_of:string;currencies:Record<"CDF"|"USD",Bucket>};
type Reservation={reservation_ref?:string;service_name?:string;offering?:string};
const copy={
 en:{title:"Services totals",intro:"Private summary from provider records. Declared surplus is receipts minus recorded expenses; it is not profit, verified payment, or a cash balance.",start:"From (included)",end:"Until (excluded)",asOf:"As of",job:"Job",period:"Provider period",refresh:"Show totals",billed:"Billed",received:"Declared received",outstanding:"Outstanding",unbilled:"Receipts without a current bill",excess:"Declared excess on billed jobs",jobCosts:"Job expenses",overhead:"Services overhead",expenses:"Recorded expenses",surplus:"Declared surplus (record based)",empty:"Select a job to see its private summary.",failed:"Totals are unavailable. Check your access and dates."},
 fr:{title:"Totaux Services",intro:"Résumé privé des écritures du prestataire. Le surplus déclaré est la différence entre reçus déclarés et dépenses enregistrées ; ce n'est ni un bénéfice, ni un paiement vérifié, ni un solde de trésorerie.",start:"Du (inclus)",end:"Au (exclu)",asOf:"État au",job:"Mission",period:"Période du prestataire",refresh:"Afficher les totaux",billed:"Facturé",received:"Reçus déclarés",outstanding:"Reste à recevoir",unbilled:"Reçus sans facture actuelle",excess:"Excédent déclaré sur missions facturées",jobCosts:"Dépenses de mission",overhead:"Frais généraux Services",expenses:"Dépenses enregistrées",surplus:"Surplus déclaré (selon les écritures)",empty:"Choisissez une mission pour son résumé privé.",failed:"Totaux indisponibles. Vérifiez votre accès et les dates."},
 ln:{title:"Mitango ya Services",intro:"Bokuse ya sekele ya makomi ya mopesi mosala. Surplus oyo esakolami ezali mbongo oyo alobi azwi minus depanse oyo ekomami; ezali litomba te, kofuta oyo endimami te, to mbongo oyo etikali te.",start:"Kobanda (ekoti)",end:"Kino (ekoti te)",asOf:"Ezali ndenge na",job:"Mosala",period:"Eleko ya mopesi mosala",refresh:"Lakisa mitango",billed:"Facture",received:"Mbongo oyo balobi bazwi",outstanding:"Mbongo oyo etikali",unbilled:"Mbongo ezwami sans facture ya sikoyo",excess:"Mbongo eleki oyo esakolami",jobCosts:"Depanse ya mosala",overhead:"Depanse ya Services nyonso",expenses:"Depanse oyo ekomami",surplus:"Surplus oyo esakolami (na makomi)",empty:"Pona mosala mpo na kotala bokuse na yango.",failed:"Mitango ekoki te komonana. Tala ndingisa mpe mikolo."},
 sw:{title:"Jumla za Huduma",intro:"Muhtasari binafsi wa rekodi za mtoa huduma. Ziada iliyotangazwa ni risiti zilizotangazwa pungufu ya gharama zilizorekodiwa; si faida, malipo yaliyothibitishwa au salio la fedha.",start:"Kuanzia (imejumuishwa)",end:"Hadi (haijajumuishwa)",asOf:"Hali kufikia",job:"Kazi",period:"Kipindi cha mtoa huduma",refresh:"Onyesha jumla",billed:"Bili",received:"Zilizopokelewa kwa taarifa",outstanding:"Bado kulipwa",unbilled:"Risiti bila bili ya sasa",excess:"Ziada iliyotangazwa kwa kazi zenye bili",jobCosts:"Gharama za kazi",overhead:"Gharama za jumla za Huduma",expenses:"Gharama zilizorekodiwa",surplus:"Ziada iliyotangazwa (kwa rekodi)",empty:"Chagua kazi kuona muhtasari wake binafsi.",failed:"Jumla hazipatikani. Angalia ruhusa na tarehe."}
} as const;
const today=()=>new Date().toISOString().slice(0,10);
const first=()=>today().slice(0,7)+"-01";
const next=()=>{const [year,month]=today().split("-").map(Number);return new Date(Date.UTC(year,month,1)).toISOString().slice(0,10);};

export function ServicesTotalsPanel({base,binding,locale}:{base:string;binding:string;locale:Locale}){
 const t=copy[locale]??copy.en;
 const [start,setStart]=useState(first),[end,setEnd]=useState(next),[jobs,setJobs]=useState<Reservation[]>([]),[selected,setSelected]=useState("");
 const [period,setPeriod]=useState<Totals|null>(null),[job,setJob]=useState<Totals|null>(null),[asOf,setAsOf]=useState(""),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const requestId=useRef(0);
 const headers={Accept:"application/json","X-Shida-Session":binding};
 const load=useCallback(async()=>{
  const current=++requestId.current;
  if(start>=end){setError(true);setPeriod(null);setJob(null);setAsOf("");return;}
  setBusy(true);setError(false);
  const cutoff=new Date().toISOString();
  try{
   const query=new URLSearchParams({start_date:start,end_date:end,as_of:cutoff});
   const periodResponse=await fetch(`${base}/transactions/finance/totals?${query}`,{credentials:"include",cache:"no-store",headers});
   if(!periodResponse.ok)throw new Error("period");
   const periodData=await periodResponse.json() as Totals;
   let jobData:Totals|null=null;
   if(selected){const response=await fetch(`${base}/transactions/finance/reservations/${encodeURIComponent(selected)}/totals?as_of=${encodeURIComponent(cutoff)}`,{credentials:"include",cache:"no-store",headers});if(!response.ok)throw new Error("job");jobData=await response.json() as Totals;}
   if(current===requestId.current){setPeriod(periodData);setJob(jobData);setAsOf(cutoff);}
  }catch{if(current===requestId.current){setPeriod(null);setJob(null);setAsOf("");setError(true);}}finally{if(current===requestId.current)setBusy(false);}
 },[base,binding,start,end,selected]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{let active=true;fetch(`${base}/transactions/reservations?offset=0`,{credentials:"include",cache:"no-store",headers}).then(r=>r.ok?r.json():null).then(data=>{if(active&&Array.isArray(data?.reservations)){setJobs(data.reservations);setSelected(old=>old||data.reservations[0]?.reservation_ref||"");}}).catch(()=>{});return()=>{active=false;};},[base,binding]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{queueMicrotask(()=>void load());},[load]);
 const render=(value:Totals,includeOverhead:boolean)=><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>{(["CDF","USD"] as const).map(currency=>{const bucket=value.currencies[currency];return <div key={currency} style={{border:"1px solid #cbd5e1",padding:12,borderRadius:8}}><h4>{currency}</h4><dl>{([["billed",t.billed],["declared_received",t.received],["outstanding",t.outstanding],["unbilled_receipts",t.unbilled],["declared_excess",t.excess],["job_expenses",t.jobCosts],...(includeOverhead?[["services_overhead",t.overhead]]:[]),["recorded_expenses",t.expenses],["declared_surplus",t.surplus]] as [keyof Bucket,string][]).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{bucket[key]} {currency}</dd></div>)}</dl></div>;})}</div>;
 return <section aria-label={t.title} style={{margin:"1.5rem 0",padding:"1rem",border:"1px solid #cbd5e1",borderRadius:12}}><h2>{t.title}</h2><p>{t.intro}</p><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><label>{t.start}<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>{t.end}<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><label>{t.job}<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{t.empty}</option>{jobs.map((row,index)=>row.reservation_ref&&<option key={row.reservation_ref} value={row.reservation_ref}>{row.service_name||row.offering||`${t.job} ${index+1}`}</option>)}</select></label><button type="button" disabled={busy} onClick={()=>void load()}>{t.refresh}</button></div>{error&&<p role="alert">{t.failed}</p>}{asOf&&<p>{t.asOf}: <time dateTime={asOf}>{asOf}</time></p>}{period&&<><h3>{t.period}</h3>{render(period,true)}</>}{job&&<><h3>{t.job}</h3>{render(job,false)}</>}</section>;
}
