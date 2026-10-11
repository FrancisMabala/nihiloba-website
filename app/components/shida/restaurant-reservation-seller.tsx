"use client";
import { useCallback, useEffect, useState } from 'react';
import { request } from '../../lib/restaurant-seller-browser';
import { reservationCopy, type Reservation, type ReservationLocale } from '../../lib/restaurant-reservation-copy';

type Setting={enabled:boolean;revision:number;available:boolean};
export function RestaurantReservationSeller({path,binding,locale}:{path:string;binding:string;locale:ReservationLocale}){
  const t=reservationCopy[locale];
  const [setting,setSetting]=useState<Setting|null>(null),[items,setItems]=useState<Reservation[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [page,setPage]=useState(1);
  const load=useCallback(async()=>{try{const [current,listing]=await Promise.all([
    request(`${path}/reservations/setting`,{},binding) as Promise<Setting>,
    request(`${path}/reservations?page=${page}&page_size=50`,{},binding) as Promise<{items:Reservation[]}>]);
    setSetting(current);setItems(listing.items);setError('');}catch{setError(t.retry);}},[path,binding,t.retry,page]);
  useEffect(()=>{queueMicrotask(()=>void load());},[load]);
  const localTime=(item:Reservation)=>new Intl.DateTimeFormat(locale,{timeZone:item.timezone_name,dateStyle:'medium',timeStyle:'short'}).format(new Date(item.starts_at));
  async function configure(){if(!setting||busy)return;setBusy(true);try{await request(`${path}/reservations/setting`,{method:'PUT',body:JSON.stringify({enabled:!setting.enabled,expected_revision:setting.revision,operation_key:crypto.randomUUID().replaceAll('-','')})},binding);await load();}catch{setError(t.retry);await load();}finally{setBusy(false);}}
  async function act(item:Reservation,action:'accept'|'reject'|'cancel'|'arrive'|'complete'){if(busy)return;setBusy(true);try{await request(`${path}/reservations/${item.reservation_ref}/${action}`,{method:'POST',body:JSON.stringify({expected_revision:item.revision,operation_key:crypto.randomUUID().replaceAll('-','')})},binding);await load();}catch{setError(t.retry);await load();}finally{setBusy(false);}}
  return <section className="rst-card" lang={locale}><h2>{t.requests}</h2><p>{t.noCapacity}</p><p>{t.noOrder}</p>{setting&&<><p>{t.setting}: {setting.enabled?t.enable:t.disable}</p><p>{t.settingHelp}</p><button type="button" disabled={busy} onClick={()=>void configure()}>{setting.enabled?t.disable:t.enable}</button></>}
    <button type="button" disabled={busy} onClick={()=>void load()}>{t.refresh}</button>{error&&<p role="status">{error}</p>}
    {items.length?items.map(item=><article key={item.reservation_ref} className="rst-card"><h3>{localTime(item)} · {item.timezone_name}</h3><p>{item.party_size} {t.size} · {t[item.state]}</p><p>{t.overlap}: {item.overlapping_requests??0}</p><div className="rst-actions">
      {item.state==='pending'&&<><button type="button" disabled={busy} onClick={()=>void act(item,'accept')}>{t.accept}</button><button type="button" disabled={busy} onClick={()=>void act(item,'reject')}>{t.reject}</button></>}
      {['pending','accepted'].includes(item.state)&&<button type="button" disabled={busy} onClick={()=>void act(item,'cancel')}>{t.cancel}</button>}
      {item.state==='accepted'&&<button type="button" disabled={busy} onClick={()=>void act(item,'arrive')}>{t.arrive}</button>}
      {item.state==='arrived'&&<button type="button" disabled={busy} onClick={()=>void act(item,'complete')}>{t.complete}</button>}
    </div></article>):<p>{t.noRows}</p>}<div className="rst-actions"><button type="button" disabled={busy||page<=1} onClick={()=>setPage(page-1)}>{t.previous}</button><span>{page}</span><button type="button" disabled={busy||items.length<50} onClick={()=>setPage(page+1)}>{t.next}</button></div>
  </section>;
}
