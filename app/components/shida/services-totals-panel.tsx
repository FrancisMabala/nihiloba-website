"use client";
import {inclusiveDateRange,shiftDay,serviceTimestamp} from "../../lib/service-time";
import {useCallback,useEffect,useRef,useState} from "react";

type Locale="fr"|"en"|"ln"|"sw";
type Bucket={billed:string;declared_received:string;outstanding:string;unbilled_receipts:string;declared_excess:string;job_expenses:string;services_overhead:string;recorded_expenses:string;declared_surplus:string};
type Totals={as_of:string;currencies:Record<"CDF"|"USD",Bucket>;expense_categories?:Record<"CDF"|"USD",Record<string,string>>};
type Entry={entry_ref:string;measure:string;direction:number;amount:string;currency:"CDF"|"USD";effective_date:string;category:string;effect:string;correction_state:string;recorded_at:string};
type Reservation={reservation_ref?:string;service_name?:string;offering?:string;requester_name?:string;requested_datetime?:string};
const copy={
 en:{moreBookings:"More bookings",title:"Services totals",intro:"A summary of your bills, recorded receipts and expenses.",start:"From",end:"Through",asOf:"As of",job:"Job",period:"Provider period",refresh:"Show totals",billed:"Billed",received:"Recorded receipts",outstanding:"Outstanding",unbilled:"Receipts without a current bill",excess:"Recorded receipts above the bill",jobCosts:"Job expenses",overhead:"Expenses for my activity",expenses:"Recorded expenses",surplus:"Recorded receipts minus expenses",empty:"Select a job to see its private summary.",failed:"Totals are unavailable. Check your access and dates."},
 fr:{moreBookings:"Autres réservations",title:"Totaux Services",intro:"Le résumé de vos factures, encaissements et dépenses enregistrés.",start:"Du",end:"Au",asOf:"État au",job:"Mission",period:"Période du prestataire",refresh:"Afficher les totaux",billed:"Facturé",received:"Reçus déclarés",outstanding:"Reste à recevoir",unbilled:"Reçus sans facture actuelle",excess:"Excédent déclaré sur missions facturées",jobCosts:"Dépenses de mission",overhead:"Frais généraux Services",expenses:"Dépenses enregistrées",surplus:"Encaissements moins dépenses",empty:"Choisissez une mission pour son résumé privé.",failed:"Totaux indisponibles. Vérifiez votre accès et les dates."},
 ln:{moreBookings:"Ba rendez-vous mosusu",title:"Mitango ya Services",intro:"Bokuse ya ba facture, mbongo ozwi mpe depanse oyo okomi.",start:"Kobanda",end:"Kino",asOf:"Ezali ndenge na",job:"Mosala",period:"Eleko ya mopesi mosala",refresh:"Lakisa mitango",billed:"Facture",received:"Mbongo oyo balobi bazwi",outstanding:"Mbongo oyo etikali",unbilled:"Mbongo ezwami sans facture ya sikoyo",excess:"Mbongo eleki oyo esakolami",jobCosts:"Depanse ya mosala",overhead:"Depanse ya Services nyonso",expenses:"Depanse oyo ekomami",surplus:"Mbongo ozwi koleka depanse",empty:"Pona mosala mpo na kotala bokuse na yango.",failed:"Mitango ekoki te komonana. Tala ndingisa mpe mikolo."},
 sw:{moreBookings:"Nafasi zaidi",title:"Jumla za Huduma",intro:"Muhtasari wa bili, mapokezi na gharama ulizorekodi.",start:"Kuanzia",end:"Hadi",asOf:"Hali kufikia",job:"Kazi",period:"Kipindi cha mtoa huduma",refresh:"Onyesha jumla",billed:"Bili",received:"Zilizopokelewa kwa taarifa",outstanding:"Bado kulipwa",unbilled:"Risiti bila bili ya sasa",excess:"Ziada iliyotangazwa kwa kazi zenye bili",jobCosts:"Gharama za kazi",overhead:"Gharama za jumla za Huduma",expenses:"Gharama zilizorekodiwa",surplus:"Mapokezi pungufu ya gharama",empty:"Chagua kazi kuona muhtasari wake binafsi.",failed:"Jumla hazipatikani. Angalia ruhusa na tarehe."}
} as const;
const detailCopy={
 en:{categories:"Expenses by category",current:"Current declarations",trail:"Correction trail",more:"More entries",none:"No recorded job expense.",receipt:"Provider-declared receipt",expense:"Recorded expense",initial:"Original",reversal:"Cancelled record",replacement:"Replacement"},
 fr:{categories:"Dépenses par catégorie",current:"Déclarations actuelles",trail:"Historique des corrections",more:"Autres écritures",none:"Aucune dépense de mission enregistrée.",receipt:"Reçu déclaré par le prestataire",expense:"Dépense enregistrée",initial:"Écriture initiale",reversal:"Écriture annulée",replacement:"Remplacement"},
 ln:{categories:"Depanse na lolenge",current:"Makomi ya sikoyo",trail:"Lisolo ya mabongisi",more:"Makomi mosusu",none:"Depanse ya mosala ekomami te.",receipt:"Reçu oyo mopesi mosala asakoli",expense:"Depanse ekomami",initial:"Ya liboso",reversal:"Lokoma elongolami",replacement:"Remplacement"},
 sw:{categories:"Gharama kwa aina",current:"Rekodi za sasa",trail:"Historia ya masahihisho",more:"Rekodi zaidi",none:"Hakuna gharama ya kazi iliyorekodiwa.",receipt:"Risiti iliyotangazwa na mtoa huduma",expense:"Gharama iliyorekodiwa",initial:"Rekodi ya awali",reversal:"Rekodi iliyofutwa",replacement:"Mbadala"},
} as const;
const categoryCopy:Record<Locale,Record<string,string>>={
 en:{general:"General",inventory_purchase:"Materials and stock",transport:"Transport",rent:"Rent",utilities:"Utilities",salary_wages:"Wages",supplies:"Supplies",maintenance:"Maintenance",other_expense:"Other expense"},
 fr:{general:"Général",inventory_purchase:"Matériaux et stock",transport:"Transport",rent:"Loyer",utilities:"Services publics",salary_wages:"Salaires",supplies:"Fournitures",maintenance:"Entretien",other_expense:"Autre dépense"},
 ln:{general:"Ya nyonso",inventory_purchase:"Biloko ya mosala",transport:"Transport",rent:"Loyer",utilities:"Mayi mpe courant",salary_wages:"Lifuti ya basali",supplies:"Biloko",maintenance:"Bobateli",other_expense:"Depanse mosusu"},
 sw:{general:"Jumla",inventory_purchase:"Vifaa na bidhaa",transport:"Usafiri",rent:"Kodi",utilities:"Huduma za matumizi",salary_wages:"Mishahara",supplies:"Vifaa",maintenance:"Matengenezo",other_expense:"Gharama nyingine"},
};
const today=()=>new Date().toISOString().slice(0,10);
const first=()=>today().slice(0,7)+"-01";
const next=()=>{const [year,month]=today().split("-").map(Number);return new Date(Date.UTC(year,month,1)).toISOString().slice(0,10);};

export function ServicesTotalsPanel({base,binding,locale,initialReservationRef=null}:{base:string;binding:string;locale:Locale;initialReservationRef?:string|null}){

 const [moreBookings,setMoreBookings]=useState(true);
 const bookingPageScope=useRef(0),bookingPageBusy=useRef(false);
 useEffect(()=>{bookingPageScope.current++;bookingPageBusy.current=false;return()=>{bookingPageScope.current++;};},[base,binding]);
 async function loadMoreBookings(){
  if(bookingPageBusy.current)return;
  const scope=bookingPageScope.current;bookingPageBusy.current=true;setBusy(true);
  try{const response=await fetch(`${base}/transactions/reservations?offset=${jobs.length}`,{credentials:"include",cache:"no-store",headers:{Accept:"application/json","X-Shida-Session":binding}});
   if(scope!==bookingPageScope.current)return;
   if(!response.ok){if([401,403].includes(response.status)){setJobs([]);setPeriod(null);setJob(null);setEntries([]);}throw Error();}
   const data=await response.json();if(scope!==bookingPageScope.current)return;const added=Array.isArray(data.reservations)?data.reservations:[];
   setJobs(old=>[...old,...added]);setMoreBookings(added.length===100);
  }catch{if(scope===bookingPageScope.current)setError(true);}finally{if(scope===bookingPageScope.current){bookingPageBusy.current=false;setBusy(false);}}
 }
 const t=copy[locale]??copy.en;
 const d=detailCopy[locale]??detailCopy.en;
 const [start,setStart]=useState(first),[end,setEnd]=useState(()=>shiftDay(next(),-1)),[jobs,setJobs]=useState<Reservation[]>([]),[selected,setSelected]=useState(initialReservationRef??"");
 const [period,setPeriod]=useState<Totals|null>(null),[job,setJob]=useState<Totals|null>(null),[asOf,setAsOf]=useState(""),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const [entries,setEntries]=useState<Entry[]>([]),[nextEntry,setNextEntry]=useState<number|null>(null);
 const requestId=useRef(0);
 const sectionRef=useRef<HTMLElement|null>(null);
 const headers={Accept:"application/json","X-Shida-Session":binding};
 const load=useCallback(async()=>{
  const current=++requestId.current;
  if(!start||!end||start>end){setError(true);setPeriod(null);setJob(null);setAsOf("");return;}
  setBusy(true);setError(false);
  const cutoff=new Date().toISOString();
  try{
   const query=new URLSearchParams({...inclusiveDateRange(start,end),as_of:cutoff});
   const periodResponse=await fetch(`${base}/transactions/finance/totals?${query}`,{credentials:"include",cache:"no-store",headers});
   if(!periodResponse.ok)throw new Error("period");
   const periodData=await periodResponse.json() as Totals;
   if(!periodData?.currencies?.CDF||!periodData?.currencies?.USD)throw new Error("period");
   let jobData:Totals|null=null;
   let history:{entries:Entry[];next_offset:number|null}={entries:[],next_offset:null};
   if(selected){const [response,historyResponse]=await Promise.all([
    fetch(`${base}/transactions/finance/reservations/${encodeURIComponent(selected)}/totals?as_of=${encodeURIComponent(cutoff)}`,{credentials:"include",cache:"no-store",headers}),
    fetch(`${base}/transactions/finance/entries?reservation_ref=${encodeURIComponent(selected)}`,{credentials:"include",cache:"no-store",headers})]);
    if(!response.ok||!historyResponse.ok)throw new Error("job");jobData=await response.json() as Totals;if(!jobData?.currencies?.CDF||!jobData?.currencies?.USD)throw new Error("job");history=await historyResponse.json();}
   if(current===requestId.current){setPeriod(periodData);setJob(jobData);setAsOf(cutoff);setEntries(history.entries??[]);setNextEntry(history.next_offset??null);}
  }catch{if(current===requestId.current){setPeriod(null);setJob(null);setEntries([]);setNextEntry(null);setAsOf("");setError(true);}}finally{if(current===requestId.current)setBusy(false);}
 },[base,binding,start,end,selected]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{let active=true;fetch(`${base}/transactions/reservations?offset=0`,{credentials:"include",cache:"no-store",headers}).then(r=>r.ok?r.json():null).then(data=>{if(active&&Array.isArray(data?.reservations)){setJobs(data.reservations);setMoreBookings(data.reservations.length===100);setSelected(old=>old||data.reservations[0]?.reservation_ref||"");}}).catch(()=>{});return()=>{active=false;};},[base,binding]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{queueMicrotask(()=>void load());},[load]);
 useEffect(()=>{const choose=(event:Event)=>{const ref=(event as CustomEvent<string>).detail;if(/^RSV_[A-Za-z0-9_-]+$/.test(ref)){setSelected(ref);sectionRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}};window.addEventListener("services:job-cost",choose);return()=>window.removeEventListener("services:job-cost",choose);},[]);
 async function moreEntries(){if(nextEntry===null||!selected)return;const ticket=requestId.current,ref=selected;const response=await fetch(`${base}/transactions/finance/entries?reservation_ref=${encodeURIComponent(ref)}&offset=${nextEntry}`,{credentials:"include",cache:"no-store",headers});if(ticket!==requestId.current)return;if(!response.ok){setEntries([]);setNextEntry(null);setError(true);return;}const history=await response.json() as {entries:Entry[];next_offset:number|null};if(ticket!==requestId.current)return;setEntries(old=>[...old,...history.entries]);setNextEntry(history.next_offset??null);}
 const render=(value:Totals,includeOverhead:boolean)=><div className="svc-money-grid">{(["CDF","USD"] as const).map(currency=>{const bucket=value.currencies[currency];return <div key={currency} className="svc-currency-card"><h4>{currency}</h4><dl className="svc-money-rows">{([["billed",t.billed],["declared_received",t.received],["outstanding",t.outstanding],["unbilled_receipts",t.unbilled],["declared_excess",t.excess],["job_expenses",t.jobCosts],...(includeOverhead?[["services_overhead",t.overhead]]:[]),["recorded_expenses",t.expenses],["declared_surplus",t.surplus]] as [keyof Bucket,string][]).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{bucket[key]} {currency}</dd></div>)}</dl></div>;})}</div>;
 return <section className="services-totals" ref={sectionRef} aria-label={t.title} style={{margin:"1.5rem 0",padding:"1rem",border:"1px solid #cbd5e1",borderRadius:12}}><h2>{t.title}</h2><p>{t.intro}</p><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><label>{t.start}<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>{t.end}<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><label>{t.job}<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{t.empty}</option>{selected&&!jobs.some(row=>row.reservation_ref===selected)&&<option value={selected}>{t.job}</option>}{jobs.map((row,index)=>row.reservation_ref&&<option key={row.reservation_ref} value={row.reservation_ref}>{[row.requester_name,row.service_name||row.offering||`${t.job} ${index+1}`,row.requested_datetime].filter(Boolean).join(" · ")}</option>)}</select></label>{moreBookings&&jobs.length>0&&jobs.length%100===0&&<button type="button" disabled={busy} onClick={()=>void loadMoreBookings()}>{t.moreBookings}</button>}<button type="button" disabled={busy} onClick={()=>void load()}>{t.refresh}</button></div>{error&&<p role="alert">{t.failed}</p>}{asOf&&<p>{t.asOf}: <time dateTime={asOf}>{serviceTimestamp(asOf,locale)}</time></p>}{period&&<><h3>{t.period}</h3>{render(period,true)}</>}{job&&<><h3>{t.job}</h3>{render(job,false)}<h4>{d.categories}</h4><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:12}}>{(["CDF","USD"] as const).map(currency=><div key={currency}><strong>{currency}</strong>{Object.entries(job.expense_categories?.[currency]??{}).length?<ul>{Object.entries(job.expense_categories?.[currency]??{}).map(([code,amount])=><li key={code}>{categoryCopy[locale][code]??categoryCopy[locale].other_expense}: {amount} {currency}</li>)}</ul>:<p>{d.none}</p>}</div>)}</div><h4>{d.current}</h4><ul>{entries.filter(entry=>entry.direction>0&&entry.correction_state!=="corrected_original").map(entry=><li key={entry.entry_ref}>{entry.measure==="recorded_income"?d.receipt:d.expense} · {entry.amount} {entry.currency} · {entry.effective_date}{entry.measure==="recorded_expense"?` · ${categoryCopy[locale][entry.category]??categoryCopy[locale].other_expense}`:""}</li>)}</ul><h4>{d.trail}</h4><ul>{entries.map(entry=><li key={entry.entry_ref}>{entry.effect==="reversal"?d.reversal:entry.effect==="replacement"?d.replacement:d.initial} · {entry.measure==="recorded_income"?d.receipt:d.expense} · {entry.direction<0?"−":"+"}{entry.amount} {entry.currency} · {entry.effective_date} · {serviceTimestamp(entry.recorded_at,locale)}</li>)}</ul>{nextEntry!==null&&<button type="button" onClick={()=>void moreEntries()}>{d.more}</button>}</>}</section>;
}
