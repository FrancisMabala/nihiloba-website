'use client';
import {receivingCopy} from '@/app/lib/restaurant-receiving';
import { useEffect, useRef, useState } from 'react';
import { useConfirmation } from './confirmation-dialog';
import { useWorkRequest } from '@/app/lib/restaurant-work';
import {useRestaurantReturn} from '@/app/lib/use-restaurant-return';
import {intakeDesignText} from '@/app/lib/restaurant-intake-design-copy';
import { guestAutoCopy, type GuestAutoAccept as Setting } from '@/app/lib/restaurant-guest-auto-accept';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';

export function RestaurantGuestAutoAccept({path,binding,locale,onFailure}:{path:string;binding:string;locale:RestaurantLocale;onFailure:(error:unknown)=>void}) {
  const api=useWorkRequest(binding,onFailure), copy={...guestAutoCopy[locale],description:`${guestAutoCopy[locale].description} ${receivingCopy[locale].qrLimit}`};
  const {request:confirm,confirmation}=useConfirmation(locale),latest=useRef(api);
  useEffect(()=>{latest.current=api;},[api]);
  const [setting,setSetting]=useState<Setting|null>(null),[fresh,setFresh]=useState(false),[desired,setDesired]=useState<boolean|null>(null);
  useRestaurantReturn(`${binding}:${path}:qr`,api.busy,refresh,()=>setFresh(false));
  async function refresh(){const value=await api.run<Setting>(`${path}/guest-auto-accept`);if(value){setSetting(value);setFresh(true);if(api.conflict){api.reset();setDesired(null);}}}
  async function change(enabled:boolean){
    if(api.busy)return;const current=await api.run<Setting>(`${path}/guest-auto-accept`);if(!current){setFresh(false);return;}setSetting(current);setFresh(true);
    const body={operation_key:crypto.randomUUID(),expected_revision:current.revision,enabled};
    confirm({title:copy.title,description:`${enabled?copy.on:copy.off} ${copy.description}`,confirmLabel:enabled?copy.enable:copy.disable,severity:'warning',onConfirm:async()=>{
      if(latest.current.conflict)throw new Error('409');
      setDesired(enabled);
      const value=await latest.current.run<Setting>(`${path}/guest-auto-accept`,'PUT',body);
      if(!value)throw new Error('incomplete');
      setSetting(value);setDesired(null);setFresh(true);
    }});
  }
  const d=(key:Parameters<typeof intakeDesignText>[1])=>intakeDesignText(locale,key);
  return <section className="rst-card rst-work rst-qr-choices" lang={locale}>{confirmation}<h2>{d('qr')}</h2><fieldset disabled={api.busy||!api.online||api.conflict||!!api.pending}><label><input type="radio" name="qr-acceptance" checked={fresh&&setting?.enabled===false} onChange={()=>void change(false)}/><span><strong>{d('manual')}</strong><small>{d('manualHelp')}</small></span></label><label><input type="radio" name="qr-acceptance" checked={fresh&&setting?.enabled===true} onChange={()=>void change(true)}/><span><strong>{d('automatic')}</strong>{fresh&&setting?.enabled&&<small>{d('automaticHelp')}</small>}</span></label></fieldset>
  {!fresh&&<p role="status">{d('error')} <button type="button" disabled={api.busy} onClick={()=>void refresh()}>{copy.refresh}</button></p>}{api.pending&&<p role="status">{copy.uncertain} <button type="button" disabled={api.busy||api.conflict} onClick={()=>void change(desired??false)}>{copy.retry}</button></p>}{api.message&&<p role="status">{api.message==='saved'?'✓':api.message==='uncertain'?copy.uncertain:copy.stale}</p>}
  <details><summary>{d('details')}</summary><p>{copy.description}</p></details></section>;
}
