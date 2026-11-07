'use client';
import {receivingCopy} from '@/app/lib/restaurant-receiving';
import { useEffect, useRef, useState } from 'react';
import { useConfirmation } from './confirmation-dialog';
import { useWorkRequest } from '@/app/lib/restaurant-work';
import { request } from '@/app/lib/restaurant-seller-browser';
import { guestAutoCopy, type GuestAutoAccept as Setting } from '@/app/lib/restaurant-guest-auto-accept';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';

export function RestaurantGuestAutoAccept({path,binding,locale,onFailure}:{path:string;binding:string;locale:RestaurantLocale;onFailure:(error:unknown)=>void}) {
  const api=useWorkRequest(binding,onFailure), copy={...guestAutoCopy[locale],description:`${guestAutoCopy[locale].description} ${receivingCopy[locale].qrLimit}`};
  const {request:confirm,confirmation}=useConfirmation(locale),latest=useRef(api);
  useEffect(()=>{latest.current=api;},[api]);
  const [setting,setSetting]=useState<Setting|null>(null),[fresh,setFresh]=useState(false),[desired,setDesired]=useState<boolean|null>(null);
  useEffect(()=>{let active=true;request(`${path}/guest-auto-accept`,{},binding).then(value=>{if(active){setSetting(value as Setting);setFresh(true);}}).catch(error=>{if(active)onFailure(error);});const stale=()=>setFresh(false);window.addEventListener('focus',stale);window.addEventListener('offline',stale);return()=>{active=false;window.removeEventListener('focus',stale);window.removeEventListener('offline',stale);};},[path,binding]); // eslint-disable-line react-hooks/exhaustive-deps
  async function refresh(){const value=await api.run<Setting>(`${path}/guest-auto-accept`);if(value){setSetting(value);setFresh(true);if(api.conflict){api.reset();setDesired(null);}}}
  function change(enabled:boolean){
    if(!setting)return;
    const body={operation_key:crypto.randomUUID(),expected_revision:setting.revision,enabled};
    confirm({title:copy.title,description:`${enabled?copy.on:copy.off} ${copy.description}`,confirmLabel:enabled?copy.enable:copy.disable,severity:'warning',onConfirm:async()=>{
      if(latest.current.conflict)throw new Error('409');
      setDesired(enabled);
      const value=await latest.current.run<Setting>(`${path}/guest-auto-accept`,'PUT',body);
      if(!value)throw new Error('incomplete');
      setSetting(value);setDesired(null);setFresh(true);
    }});
  }
  return <section className="rst-card rst-work" lang={locale}>{confirmation}<h2>{copy.title}</h2><p>{copy.description}</p><p role="status">{setting?(setting.enabled?copy.on:copy.off):copy.stale}</p>{!fresh&&<p>{copy.stale}</p>}{api.pending&&<p>{copy.uncertain}</p>}{api.message&&<p role="status">{api.message==='saved'?'✓':api.message==='uncertain'?copy.uncertain:copy.stale}</p>}<div className="rst-actions"><button type="button" disabled={api.busy||!api.online} onClick={()=>void refresh()}>{copy.refresh}</button><button type="button" disabled={!setting||!fresh||api.busy||api.conflict||!api.online} onClick={()=>void change(desired??!setting!.enabled)}>{api.pending?copy.retry:setting?.enabled?copy.disable:copy.enable}</button></div></section>;
}
