'use client';
import {useEffect,useState} from 'react';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';
import type {Hours} from '../../lib/restaurant-seller';
import {request} from '../../lib/restaurant-seller-browser';
import {useWorkRequest,useWorkDraft,type Configuration} from '../../lib/restaurant-work';
import {validSchedule} from '../../lib/restaurant-schedule';
import {workText} from '../../lib/restaurant-work-copy';
import {soloCopy} from '../../lib/restaurant-solo-copy';

export function RestaurantQuickQr({path,binding,locale,hours,onOpen,onFailure}:{path:string;binding:string;locale:RestaurantLocale;hours:Hours|null;onOpen:(tab:string)=>void;onFailure:(e:unknown)=>void}){
 const c=soloCopy[locale],api=useWorkRequest(binding,onFailure);
 const [config,setConfig]=useState<Configuration|null>(null),[review,setReview]=useState(false),[fresh,setFresh]=useState(false);
 useWorkDraft(review||!!api.pending,workText(locale,'discard'));
 useEffect(()=>{let active=true;void request(`${path}/order-configuration`,{},binding).then(value=>{if(active){setConfig(value as Configuration);setFresh(true);}}).catch(onFailure);const stale=()=>setFresh(false);window.addEventListener('offline',stale);window.addEventListener('focus',stale);return()=>{active=false;window.removeEventListener('offline',stale);window.removeEventListener('focus',stale);};},[path,binding]); // eslint-disable-line react-hooks/exhaustive-deps
 const schedule={weekly_periods:hours?.schedule?.windows??[],minimum_lead_minutes:0,cutoff_minutes:0,allow_tomorrow:false};
 const enabled=config?.pickup?.enabled??false;
 async function refresh(){const v=await api.run<Configuration>(`${path}/order-configuration`);if(v){setConfig(v);setFresh(true);if(api.conflict){api.reset();setReview(false);}}}
 async function save(){if(!config)return;const result=await api.run(`${path}/pickup-intake`,'PUT',{operation_key:crypto.randomUUID(),expected_updated_at:config.revision,enabled:!enabled,windows:[],...(!enabled?{schedule}:{})});if(result){setReview(false);await refresh();}}
 return <section className="rst-card rst-quick-qr"><h3>{c.qr}</h3><p>{c.qrHelp}</p><strong>{fresh&&config?(enabled?c.enabled:c.disabled):c.unknown}</strong><div className="rst-actions"><button type="button" disabled={api.busy||!api.online} onClick={()=>void refresh()}>{c.refresh}</button><button type="button" disabled={!fresh||!config?.intake_released||api.busy||!!api.pending||api.conflict||!api.online||!enabled&&(!hours?.confirmed_at||!validSchedule(schedule))} onClick={()=>setReview(true)}>{enabled?c.disableQr:c.enableQr}</button><button type="button" onClick={()=>onOpen('hours')}>{c.hours}</button><button type="button" onClick={()=>onOpen('sharing')}>{c.menu}</button></div>{review&&<div className="rst-settings-review"><p>{enabled?c.disableQr:c.qrEffect}</p><button type="button" disabled={api.busy||!fresh||api.conflict||!api.online} onClick={()=>void save()}>{api.pending?c.retry:workText(locale,'confirm')}</button>{!api.pending&&<button type="button" onClick={()=>setReview(false)}>{workText(locale,'back')}</button>}</div>}{api.message&&<p role="status">{workText(locale,api.message)}</p>}</section>;
}
