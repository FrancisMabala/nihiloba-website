'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {helpText,questionSubject,type HelpLocale} from '../../lib/help-questions-copy';
import {HelpConversation,type HelpDetail,type HelpQuestion} from './help-conversation';
import {useHelpDrafts} from '../../lib/help-question-drafts';
import {OFFICIAL_CHANNELS} from '../../lib/brand';
import './help-questions.css';
type Topic='using_shida'|'features'|'suggestion'|'other';
type Question=HelpQuestion;
type Detail=HelpDetail;
export function HelpQuestions({locale,binding,displayName=''}:{locale:HelpLocale;binding:string;displayName?:string}){
 const t=(key:Parameters<typeof helpText>[1])=>helpText(locale,key);
 const [view,setView]=useState<'ask'|'mine'|'faq'>('ask'),[topic,setTopic]=useState<Topic>('using_shida');
 const {drafts,setDrafts,ready,unavailable}=useHelpDrafts(binding);
 const [detail,setDetail]=useState<Detail|null>(null),[items,setItems]=useState<Question[]>([]);
 const [busy,setBusy]=useState(false),[opening,setOpening]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState(''),[error,setError]=useState(false),[page,setPage]=useState(1),[more,setMore]=useState(false);
 const lock=useRef(false), mounted=useRef(true),generation=useRef(0),selected=useRef<string|null>(null);
 const [retryAction,setRetryAction]=useState<'submit'|'complete'|'detail'|'refresh'>('refresh');
 const draftId=detail?.question.reference??'new', draft=drafts[draftId]??{message:'',key:''};
 const api=useCallback(async(path='',body?:object,signal?:AbortSignal)=>{
  const response=await fetch('/api/shida/personal/support/questions'+path,{method:body?'POST':'GET',signal,cache:'no-store',headers:{'x-shida-session':binding,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error();return response.json();
 },[binding]);
 const refresh=useCallback(async(signal?:AbortSignal)=>{const result=await api(`?page=${page}`,undefined,signal);if(!signal?.aborted){setItems(result.questions);setMore(result.has_more);setLoading(false);}},[api,page]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{const controller=new AbortController();void api(`?page=${page}`,undefined,controller.signal).then(result=>{if(!controller.signal.aborted){setItems(result.questions);setMore(result.has_more);setLoading(false);}}).catch(()=>{if(!controller.signal.aborted){setError(true);setLoading(false);}});return()=>{controller.abort();};},[api,page]);
 useEffect(()=>{const reference=new URLSearchParams(window.location.search).get('question');if(!reference||!/^SCT_[A-Za-z0-9_-]+$/.test(reference))return;selected.current=reference;const epoch=generation.current;const controller=new AbortController();queueMicrotask(()=>{if(!controller.signal.aborted&&epoch===generation.current){setOpening(true);setView('mine');}});void api('/'+reference,undefined,controller.signal).then(value=>{if(!controller.signal.aborted&&epoch===generation.current){setDetail(value);setView('mine');setOpening(false);}}).catch(()=>{if(!controller.signal.aborted&&epoch===generation.current){setError(true);setRetryAction('detail');setOpening(false);}});return()=>controller.abort();},[api]);
 const reference=detail?.question.reference,lastId=detail?.messages.at(-1)?.id;
 useEffect(()=>{if(!reference)return;void api('/'+reference+'/read',{}).catch(()=>{});},[api,reference,lastId]);
 useEffect(()=>{if(!reference)return;const controller=new AbortController();let inFlight=false;
  const update=async()=>{if(document.hidden||!navigator.onLine||lock.current||inFlight)return;inFlight=true;const epoch=generation.current;
   try{const value=await api('/'+reference,undefined,controller.signal);if(!controller.signal.aborted&&epoch===generation.current&&!lock.current)setDetail(value);}
   catch{if(!controller.signal.aborted&&epoch===generation.current){setError(true);setRetryAction('detail');}}
   finally{inFlight=false;}
  };
  const timer=setInterval(()=>void update(),15000);window.addEventListener('focus',update);window.addEventListener('online',update);document.addEventListener('visibilitychange',update);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',update);document.removeEventListener('visibilitychange',update);};
 },[api,reference]);
 async function run(work:()=>Promise<void>,action:typeof retryAction='refresh'){if(lock.current)return;lock.current=true;++generation.current;setBusy(true);setError(false);setNotice('');try{await work();}catch{if(mounted.current){setError(true);setRetryAction(action);}}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 function edit(message:string){setDrafts(old=>({...old,[draftId]:{message,key:crypto.randomUUID()}}));}
 function selectUrl(reference:string|null){const url=new URL(window.location.href);if(reference)url.searchParams.set('question',reference);else url.searchParams.delete('question');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}
 async function open(reference:string){selected.current=reference;setOpening(true);setDetail(null);setView('mine');await run(async()=>{const value=await api('/'+reference);if(!mounted.current)return;setDetail(value);setView('mine');selectUrl(reference);},'detail');if(mounted.current)setOpening(false);}
 async function submit(){if(!ready||!draft.message.trim())return;await run(async()=>{const payload={message:draft.message,request_id:draft.key};let result;if(detail)result=await api('/'+detail.question.reference+'/reply',payload);else{const created=await api('',{...payload,topic,language:locale});result=await api('/'+created.question.reference);}if(!mounted.current)return;setDrafts(old=>({...old,[draftId]:{message:'',key:''}}));setDetail(result);selected.current=result.question.reference;selectUrl(result.question.reference);setView('mine');setNotice(t(detail?'saved':'sent'));await refresh().catch(()=>{setError(true);setRetryAction('refresh');});},'submit');}
 async function complete(){if(!detail)return;await run(async()=>{await api('/'+detail.question.reference+(detail.question.status==='closed'?'/reopen':'/close'),{});const value=await api('/'+detail.question.reference);if(mounted.current)setDetail(value);await refresh();},'complete');}
 function retry(){if(retryAction==='submit')void submit();else if(retryAction==='complete')void complete();else if(retryAction==='detail'&&selected.current)void open(selected.current);else void run(()=>refresh());}
 function tab(next:typeof view){const previous=selected.current;++generation.current;selected.current=null;setOpening(false);setView(next);setDetail(null);setNotice('');setError(false);selectUrl(null);if(next==='mine'&&previous)requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(`[data-help-question="${CSS.escape(previous)}"]`)?.focus({preventScroll:true}));}
 const base=`${locale==='en'?'':`/${locale}`}/shida/space`;
 const whatsapp=detail?new URL(OFFICIAL_CHANNELS.whatsapp):null;
 if(whatsapp&&detail)whatsapp.searchParams.set('text',`${t('prepared')} ${detail.question.display_reference}`);
 return <section className={`help-questions${detail?' help-thread-open':''}`}><p className="help-intro">{t('intro')}</p><nav className="help-tabs" aria-label={t('title')}>{(['ask','mine','faq'] as const).map(key=><button key={key} type="button" disabled={busy} aria-current={view===key?'page':undefined} onClick={()=>tab(key)}>{t(key)}</button>)}</nav>
 {notice&&<p role="status">{notice}</p>}{unavailable&&<p className="help-hint">{t('draftUnavailable')}</p>}{error&&<p role="alert">{t('error')} <button type="button" disabled={busy} onClick={retry}>{t('retry')}</button></p>}
 {opening?<p role="status">{t('loading')}</p>:detail?<HelpConversation key={detail.question.reference} detail={detail} locale={locale} displayName={displayName} draft={draft.message} busy={busy} ready={ready} whatsapp={whatsapp?.href??null} onEdit={edit} onSubmit={()=>void submit()} onBack={()=>tab('mine')} onComplete={()=>void complete()}/>
 :view==='ask'?<section className="help-card"><h2>{t('ask')}</h2><form onSubmit={event=>{event.preventDefault();void submit();}}><label htmlFor="question-topic">{t('topic')}</label><select id="question-topic" value={topic} disabled={busy} onChange={e=>{setTopic(e.target.value as Topic);if(draft.message)edit(draft.message);}}>{(['using_shida','features','suggestion','other'] as const).map(key=><option key={key} value={key}>{t(key)}</option>)}</select><label htmlFor="question-body">{t('question')}</label><textarea id="question-body" rows={6} disabled={busy||!ready} value={draft.message} onChange={e=>edit(e.target.value)} required maxLength={4000} aria-describedby="question-hint"/><button className="help-primary" disabled={busy||!ready||!draft.message.trim()}>{t('send')}</button><p id="question-hint" className="help-hint">{t('hint')}</p></form><a href={base+'?view=support'}>{t('report')}</a></section>
 :view==='mine'?<section className="help-card"><header className="help-actions"><h2>{t('mine')}</h2><button disabled={busy} onClick={()=>void run(()=>refresh())}>{t('retry')}</button></header>{loading?<p role="status">{t('loading')}</p>:!items.length&&!error?<p>{t('empty')}</p>:<ul className="help-list">{items.map(item=><li key={item.reference}><button className="help-question-link" data-help-question={item.reference} disabled={busy} onClick={()=>void open(item.reference)}><strong>{questionSubject(item.message)}</strong><span>{t(item.topic)}</span></button><span className="help-status">{t(item.status)}</span></li>)}</ul>}{(page>1||more)&&<div className="help-actions"><button disabled={page===1||busy} onClick={()=>setPage(n=>n-1)}>{t('previous')}</button><span>{page}</span><button disabled={!more||busy} onClick={()=>setPage(n=>n+1)}>{t('next')}</button></div>}</section>
 :<section className="help-card"><h2>{t('faq')}</h2><details><summary>{t('faqQuestion')}</summary><p>{t('faqAnswer')}</p></details><details><summary>{t('faqProblem')}</summary><p>{t('faqProblemAnswer')}</p><a href={base+'?view=support'}>{t('report')}</a></details></section>}
 </section>;
}
