'use client';
import { useEffect, useRef, useState } from 'react';
import { request, DashboardApiError } from '../../lib/restaurant-seller-browser';

type Locale = 'fr' | 'en' | 'ln' | 'sw';
type Line = { key:string; name:string; pricing_model:string; quantity?:number; sale_unit_label?:string; selected_amount?:string; currency?:string };
type Card = { order_ref:string; state:string; revision:number; submitted_at:string; updated_at:string; cancellation_pending:boolean; fulfillment_method:string; food_preview?:{groups:{kind:string;plate_number:number|null;lines:Line[]}[];truncated:boolean} };
type Detail = Card & { food_preference?:string|null; standalone:Line[]; plates:{key:string;components:Line[]}[] };
type Listing = {items:Card[];total:number;as_of:string};
type Feed = {changed:Card[];removed:string[];cursor:string;as_of:string};
const copy = {
 en:{title:'Kitchen',active:'Preparing queue',done:'Recently completed',orders:'Free orders',refresh:'Refresh',loading:'Loading…',empty:'No orders here.',offline:'Offline. Loaded orders may be out of date.',stale:'Orders may be out of date. Refresh before acting.',error:'Could not refresh. Loaded orders may be out of date.',lost:'Kitchen access ended. Continue outstanding work in Free orders.',checked:'Last checked',elapsed:'Elapsed',minutes:'min',start:'Start preparation',ready:'Mark ready',retry:'Retry the same action',uncertain:'Action result unconfirmed. Retry the same action or refresh.',conflict:'Order changed. Refresh to see current state.',awake:'Keep screen awake',awakeOn:'Screen awake',awakeOff:'Screen awake is inactive',awakeHelp:'Adjust device settings if needed. This does not extend sign-in.',dishes:'Dishes',plate:'Plate',amount:'Selected amount',more:'Open for all food',preference:'Food preference',none:'None',cancel:'Cancellation requested',accepted:'Accepted',preparing:'Preparing',readyState:'Ready',completed:'Completed',pickup:'Pickup',delivery:'Delivery',next:'Next',previous:'Previous'},
 fr:{title:'Cuisine',active:'Commandes à préparer',done:'Terminées récemment',orders:'Commandes gratuites',refresh:'Actualiser',loading:'Chargement…',empty:'Aucune commande ici.',offline:'Hors connexion. Les commandes affichées peuvent être anciennes.',stale:'Les commandes peuvent être anciennes. Actualisez avant d’agir.',error:'Actualisation impossible. Les commandes affichées peuvent être anciennes.',lost:'Accès Cuisine terminé. Continuez les commandes en cours dans Commandes.',checked:'Dernière vérification',elapsed:'Temps écoulé',minutes:'min',start:'Commencer la préparation',ready:'Marquer prêt',retry:'Réessayer la même action',uncertain:'Résultat non confirmé. Réessayez la même action ou actualisez.',conflict:'La commande a changé. Actualisez son état.',awake:'Garder l’écran allumé',awakeOn:'Écran maintenu allumé',awakeOff:'Maintien de l’écran inactif',awakeHelp:'Réglez la veille de l’appareil si besoin. La connexion n’est pas prolongée.',dishes:'Plats',plate:'Assiette',amount:'Montant choisi',more:'Ouvrir pour voir tous les aliments',preference:'Préférence alimentaire',none:'Aucune',cancel:'Annulation demandée',accepted:'Acceptée',preparing:'En préparation',readyState:'Prête',completed:'Terminée',pickup:'Retrait',delivery:'Livraison',next:'Suivant',previous:'Précédent'},
 ln:{title:'Kuku',active:'Bakomande ya kolamba',done:'Oyo esili kala mingi te',orders:'Bakomande ya ofele',refresh:'Zongisa ya sika',loading:'Ezali koya…',empty:'Komande ezali te awa.',offline:'Internet ezali te. Bakomande oyo emonani ekoki kozala ya kala.',stale:'Bakomande ekoki kozala ya kala. Zongisa liboso ya kosala.',error:'Kozongisa esimbi te. Bakomande ekoki kozala ya kala.',lost:'Nzela ya Kuku esili. Landisa bakomande oyo etikali na Bakomande.',checked:'Kotala ya suka',elapsed:'Ntango eleki',minutes:'min',start:'Banda kolamba',ready:'Lakisa ete esili',retry:'Meka lisusu mosala yango moko',uncertain:'Eyano endimami naino te. Meka lisusu mosala yango moko to zongisa.',conflict:'Komande ebongwani. Zongisa mpo na komona ya sika.',awake:'Tika ekran epela',awakeOn:'Ekran ezali kopela',awakeOff:'Ekran ezali na bopemi',awakeHelp:'Bongisa telefone soki esengeli. Ebakisi ntango ya kokɔta te.',dishes:'Bilei',plate:'Sani',amount:'Mbongo eponami',more:'Fungola mpo na komona bilei nyonso',preference:'Ndenge ya kolamba oyo asengi',none:'Ezali te',cancel:'Basengi kolongola',accepted:'Endimami',preparing:'Ezali kolambama',readyState:'Esili',completed:'Epesami',pickup:'Kozwa',delivery:'Komema',next:'Oyo elandi',previous:'Oyo eleki'},
 sw:{title:'Jikoni',active:'Maagizo ya kuandaa',done:'Yaliyokamilika hivi karibuni',orders:'Maagizo ya bure',refresh:'Onyesha upya',loading:'Inapakia…',empty:'Hakuna maagizo hapa.',offline:'Hakuna mtandao. Maagizo yaliyoonyeshwa yanaweza kuwa ya zamani.',stale:'Maagizo yanaweza kuwa ya zamani. Onyesha upya kabla ya kutenda.',error:'Imeshindikana kusasisha. Maagizo yanaweza kuwa ya zamani.',lost:'Ufikiaji wa Jikoni umeisha. Endelea na maagizo yaliyopo kwenye Maagizo.',checked:'Ukaguzi wa mwisho',elapsed:'Muda uliopita',minutes:'dak',start:'Anza kuandaa',ready:'Weka tayari',retry:'Jaribu tena hatua ileile',uncertain:'Matokeo hayajathibitishwa. Jaribu tena hatua ileile au sasisha.',conflict:'Agizo limebadilika. Sasisha kuona hali mpya.',awake:'Weka skrini iwake',awakeOn:'Skrini imewashwa',awakeOff:'Kuweka skrini hai hakutumiki',awakeHelp:'Badilisha mipangilio ya kifaa ikihitajika. Hii haiongezi muda wa kuingia.',dishes:'Vyakula',plate:'Sahani',amount:'Kiasi kilichochaguliwa',more:'Fungua kuona vyakula vyote',preference:'Upendeleo wa chakula',none:'Hakuna',cancel:'Ombi la kughairi',accepted:'Imekubaliwa',preparing:'Inaandaliwa',readyState:'Tayari',completed:'Imekamilika',pickup:'Kuchukua',delivery:'Kusafirisha',next:'Inayofuata',previous:'Iliyotangulia'}
} as const;

export function RestaurantKitchen({path,binding,locale,onFreeOrders}:{path:string;binding:string;locale:Locale;onFreeOrders:()=>void}) {
 const t=copy[locale], base=`${path}/kitchen`;
 const [completed,setCompleted]=useState(false),[page,setPage]=useState(1),[list,setList]=useState<Listing|null>(null),[detail,setDetail]=useState<Detail|null>(null);
 const [status,setStatus]=useState<'loading'|'fresh'|'stale'|'offline'|'error'|'lost'>('loading'),[checked,setChecked]=useState(''),[tick,setTick]=useState(0),[now,setNow]=useState(0);
 const [awake,setAwake]=useState(false),[awakeActive,setAwakeActive]=useState(false);
 const [pending,setPending]=useState<{url:string;body:string}|null>(null),[actionMessage,setActionMessage]=useState('');
 const current=useRef<Detail|null>(null),refreshNow=useRef(()=>{}),busy=useRef(false);
 useEffect(()=>{current.current=detail;},[detail]);
 useEffect(()=>{if(!pending)return;const leave=(event:Event)=>event.preventDefault();const unload=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('rst-work-leave',leave);window.addEventListener('beforeunload',unload);return()=>{window.removeEventListener('rst-work-leave',leave);window.removeEventListener('beforeunload',unload);};},[pending]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{let disposed=false,lock:WakeLockSentinel|null=null;
  async function acquire(){if(!awake||document.hidden||!navigator.wakeLock)return;try{const result=await navigator.wakeLock.request('screen');if(disposed||document.hidden){await result.release();return;}lock=result;setAwakeActive(!result.released);result.addEventListener('release',()=>{if(!disposed)setAwakeActive(false);});}catch{if(!disposed)setAwakeActive(false);}}
  const visible=()=>{if(document.hidden){void lock?.release();setAwakeActive(false);}else void acquire();};void acquire();document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;void lock?.release();document.removeEventListener('visibilitychange',visible);};
 },[awake]);
 useEffect(()=>{let alive=true,inFlight=false,cursor='',errors=0,timer:ReturnType<typeof setTimeout>|undefined;const controller=new AbortController();
  const read=<T,>(url:string)=>request(url,{signal:controller.signal},binding) as Promise<T>;
  async function refresh(full=false){if(!alive||inFlight)return;clearTimeout(timer);
   if(document.hidden||!navigator.onLine){setStatus(navigator.onLine?'stale':'offline');return;}
   inFlight=true;
   try {
    if(full||!cursor){setStatus('loading');const first=await read<Feed>(`${base}/feed?limit=50`);if(!alive)return;cursor=first.cursor;}
    const rows=await read<Listing>(`${base}/orders?page=${page}&page_size=20&completed=${completed}`);if(!alive)return;setList(rows);
    const selected=current.current;if(selected){try{const next=await read<Detail>(`${base}/orders/${selected.order_ref}`);if(alive)setDetail(previous=>!previous||previous.order_ref!==selected.order_ref||previous.revision>next.revision?previous:next);}catch(e){if(e instanceof DashboardApiError&&e.status===404){if(alive)setDetail(null);}else throw e;}}
    const delta=await read<Feed>(`${base}/feed?limit=50&cursor=${encodeURIComponent(cursor)}`);if(!alive)return;cursor=delta.cursor;
    if(delta.changed.length||delta.removed.length){const latest=await read<Listing>(`${base}/orders?page=${page}&page_size=20&completed=${completed}`);if(alive)setList(latest);}
    errors=0;setNow(Date.now());setChecked(delta.as_of);setStatus('fresh');
   }catch(e){if(!alive)return;
    if(e instanceof DashboardApiError&&[401,403,404].includes(e.status)){setList(null);setDetail(null);setStatus('lost');return;}
    if(e instanceof DashboardApiError&&e.detail==='restaurant_feed_refresh_required')cursor='';
    errors++;setStatus(navigator.onLine?'error':'offline');
   }finally{inFlight=false;if(alive&&!document.hidden&&navigator.onLine)timer=setTimeout(()=>void refresh(),Math.min(120000,15000*2**Math.min(errors,3)));}
  }
  const resume=()=>{setStatus(navigator.onLine?'stale':'offline');cursor='';if(!document.hidden&&navigator.onLine)void refresh(true);else clearTimeout(timer);};
  refreshNow.current=()=>void refresh(true);void refresh(true);document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('offline',resume);
  return()=>{alive=false;controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('offline',resume);};
 },[base,binding,page,completed,tick]);
 async function open(card:Card){if(status!=='fresh'||pending)return;try{setDetail(await request(`${base}/orders/${card.order_ref}`,{},binding) as Detail);setActionMessage('');}catch(e){if(e instanceof DashboardApiError&&[401,403,404].includes(e.status)){setList(null);setDetail(null);setStatus('lost');}else setStatus('error');}}
 async function send(next?:'start'|'ready'){if(busy.current||!navigator.onLine||status!=='fresh'||(!pending&&!detail))return;
  const operation=pending??{url:`${base}/orders/${detail!.order_ref}/actions/${next}`,body:JSON.stringify({operation_key:crypto.randomUUID(),expected_revision:detail!.revision})};
  busy.current=true;setActionMessage('');
  try{const result=await request(operation.url,{method:'POST',body:operation.body},binding) as {current_order:Detail};setDetail(result.current_order);setPending(null);setTick(n=>n+1);}
  catch(e){if(e instanceof DashboardApiError&&[401,403,404].includes(e.status)){setPending(null);setList(null);setDetail(null);setStatus('lost');}
   else if(e instanceof DashboardApiError&&e.status===409){setPending(null);setStatus('stale');setActionMessage(t.conflict);refreshNow.current();}
   else if(e instanceof DashboardApiError&&e.status===422){setPending(null);setActionMessage(t.conflict);refreshNow.current();}
   else {setPending(operation);setActionMessage(t.uncertain);}}
  finally{busy.current=false;}
 }
 function food(lines:Line[]){return <ul>{lines.map(line=><li key={line.key}>{line.name} — {line.quantity!==undefined?`${line.quantity} ${line.sale_unit_label??''}`:`${t.amount}: ${line.selected_amount} ${line.currency??''}`}</li>)}</ul>;}
 function groups(item:Detail){return <><h4>{t.dishes}</h4>{food(item.standalone)}{item.plates.map((plate,index)=><div key={plate.key}><h4>{t.plate} {index+1}</h4>{food(plate.components)}</div>)}</>;}
 function age(value:string){return `${Math.max(0,Math.floor((now-Date.parse(value))/60000))} ${t.minutes}`;}
 const state=(value:string)=>value==='accepted'?t.accepted:value==='preparing'?t.preparing:value==='ready'?t.readyState:t.completed;
 return <section className="rst-work rst-kitchen" aria-label={t.title}>
  <h2>{t.title}</h2><div className="rst-actions"><button type="button" disabled={!!pending} onClick={()=>{setCompleted(false);setPage(1);setDetail(null);}} aria-pressed={!completed}>{t.active}</button><button type="button" disabled={!!pending} onClick={()=>{setCompleted(true);setPage(1);setDetail(null);}} aria-pressed={completed}>{t.done}</button><button type="button" onClick={()=>{setStatus('stale');setTick(n=>n+1);}}>{t.refresh}</button><button type="button" disabled={!!pending} onClick={onFreeOrders}>{t.orders}</button></div>
  <label><input type="checkbox" checked={awake} onChange={e=>{setAwake(e.target.checked);setAwakeActive(false);}}/>{t.awake}</label>{awake&&<p role="status">{awakeActive?t.awakeOn:t.awakeOff} {!awakeActive&&t.awakeHelp}</p>}
  <p role="status">{status==='loading'?t.loading:status==='offline'?t.offline:status==='stale'?t.stale:status==='error'?t.error:status==='lost'?t.lost:checked?`${t.checked}: ${new Date(checked).toLocaleTimeString(locale==='ln'?'fr':locale)}`:''}</p>
  {actionMessage&&<p role="alert">{actionMessage}</p>}{pending&&<button type="button" disabled={status!=='fresh'} onClick={()=>void send()}>{t.retry}</button>}
  {status!=='lost'&&<><div className="rst-grid">{list?.items.map(card=><article className="rst-card" key={card.order_ref}><button type="button" disabled={status!=='fresh'||!!pending} onClick={()=>void open(card)}>{card.order_ref}</button><p>{state(card.state)} · {t.elapsed}: {age(card.submitted_at)}</p>{card.cancellation_pending&&<p>{t.cancel}</p>}{card.food_preview?.groups.map((group,index)=><div key={index}><strong>{group.kind==='plate'?`${t.plate} ${group.plate_number}`:t.dishes}</strong>{food(group.lines)}</div>)}{card.food_preview?.truncated&&<p>{t.more}</p>}</article>)}</div>{list&&list.items.length===0&&<p>{t.empty}</p>}<div className="rst-actions"><button type="button" disabled={page<=1||!!pending} onClick={()=>setPage(n=>n-1)}>{t.previous}</button><button type="button" disabled={!list||page*20>=list.total||!!pending} onClick={()=>setPage(n=>n+1)}>{t.next}</button></div></>}
  {detail&&status!=='lost'&&<article className="rst-card"><h3>{detail.order_ref}</h3><p>{state(detail.state)} · {t.elapsed}: {age(detail.submitted_at)} · {detail.fulfillment_method==='delivery'?t.delivery:t.pickup}</p>{detail.cancellation_pending&&<p>{t.cancel}</p>}<p>{t.preference}: {detail.food_preference||t.none}</p>{groups(detail)}<div className="rst-actions">{detail.state==='accepted'&&<button type="button" disabled={status!=='fresh'||!!pending} onClick={()=>void send('start')}>{t.start}</button>}{detail.state==='preparing'&&<button type="button" disabled={status!=='fresh'||!!pending} onClick={()=>void send('ready')}>{t.ready}</button>}</div></article>}
 </section>;
}
