"use client";
import {useState} from "react";
import {RegistrationLocation,profileLocationFields} from "./registration-location";
import {workplaceCopy} from "../../lib/services-workplace-copy";
import {useWorkDraft,leaveWork} from "../../lib/restaurant-work";
import type {ProviderLocale} from "../../lib/services-provider-copy";
import "./services-workplace.css";
export type WorkSettings={modes?:string[];workplace_name?:string;public_address?:boolean;counter_enabled?:boolean}&Record<string,unknown>;
export function ServicesProfessionalWork({locale,value={},busy,onSave}:{locale:ProviderLocale;value?:WorkSettings;busy:boolean;onSave:(value:WorkSettings)=>Promise<boolean>}){
 const t=workplaceCopy[locale];const [editing,setEditing]=useState(false),[review,setReview]=useState(false),[draft,setDraft]=useState<WorkSettings>(value),[saved,setSaved]=useState(false);
 const dirty=editing&&JSON.stringify(draft)!==JSON.stringify(value);useWorkDraft(dirty,t.cancel);
 const modes=draft.modes??[];const address=Object.fromEntries(profileLocationFields.map(key=>[key,String(draft[key]??"")]));
 function start(){setDraft(value);setEditing(true);setReview(false);setSaved(false);}
 return <section className="svc-work-settings"><header><div><h2>{t.title}</h2><p>{t.intro}</p></div>{!editing&&<button type="button" onClick={start}>{t.edit}</button>}</header>{saved&&<p role="status">{t.saved}</p>}
 {!editing?<div className="svc-work-summary">{value.modes?.map(mode=><span key={mode}>{t[mode as "workplace"|"customer"|"remote"]}</span>)}</div>:<form onSubmit={async e=>{e.preventDefault();if(!review){setReview(true);return;}if(await onSave(draft)){setEditing(false);setSaved(true);}}}><fieldset disabled={busy}>
 {!review?<><div className="svc-work-modes">{(["workplace","customer","remote"] as const).map((mode,i)=><label key={mode} data-selected={modes.includes(mode)}><input type="checkbox" checked={modes.includes(mode)} onChange={e=>setDraft(old=>({...old,modes:e.target.checked?[...modes,mode]:modes.filter(m=>m!==mode),...(mode==="workplace"&&!e.target.checked?{public_address:false}:{})}))}/><span aria-hidden="true" className="svc-mode-icon">{["⌂","◎","▣"][i]}</span><strong>{t[mode]}</strong><small>{t[`${mode}Help`]}</small></label>)}</div>
 {modes.includes("workplace")&&<section className="svc-work-address"><label>{t.name}<input required maxLength={120} value={draft.workplace_name??""} onChange={e=>setDraft(old=>({...old,workplace_name:e.target.value}))}/></label><div className="svc-work-location"><RegistrationLocation locale={locale} prefix="workplace" required values={address} onChange={values=>setDraft(old=>({...old,...values}))}/></div><label className="svc-work-check"><input type="checkbox" checked={draft.public_address===true} onChange={e=>setDraft(old=>({...old,public_address:e.target.checked}))}/>{t.consent}</label><p>{t.privacy}</p></section>}
 <label className="svc-work-counter"><span><strong>{t.counter}</strong><small>{t.counterHelp}</small></span><input type="checkbox" role="switch" checked={draft.counter_enabled!==false} onChange={e=>setDraft(old=>({...old,counter_enabled:e.target.checked}))}/></label></>:<section className="svc-work-review"><h3>{t.review}</h3>{modes.map(mode=><p key={mode}>{t[mode as "workplace"|"customer"|"remote"]}</p>)}{modes.includes("workplace")&&<><strong>{draft.workplace_name}</strong><p>{Object.values(address).filter(Boolean).join(" · ")}</p><p>{draft.public_address?t.public:t.private}</p></>}<label><input type="checkbox" checked={draft.counter_enabled!==false} readOnly/>{t.counter}</label></section>}
 <footer><button type="button" onClick={()=>{if(review)setReview(false);else if(leaveWork())setEditing(false);}}>{review?t.back:t.cancel}</button><button className="svc-primary" disabled={!modes.length||busy}>{review?t.save:t.review} →</button></footer></fieldset></form>}
 </section>;
}
