'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {helpText,questionSubject,type HelpLocale} from '../../lib/help-questions-copy';
import {OFFICIAL_CHANNELS} from '../../lib/brand';
import './help-questions.css';
type Topic='using_shida'|'features'|'suggestion'|'other';
type Question={reference:string;display_reference:string;topic:Topic;message:string;status:'open'|'answered'|'closed';created_at:string};
type Detail={question:Question;messages:{id:number;author:string;message:string;channel:string;created_at:string}[]};
type Draft={message:string;key:string};
export function HelpQuestions({locale,binding}:{locale:HelpLocale;binding:string}){
 const t=(key:Parameters<typeof helpText>[1])=>helpText(locale,key);
 const [view,setView]=useState<'ask'|'mine'|'faq'>('ask'),[topic,setTopic]=useState<Topic>('using_shida');
 const [drafts,setDrafts]=useState<Record<string,Draft>>({}),[detail,setDetail]=useState<Detail|null>(null),[items,setItems]=useState<Question[]>([]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState(''),[error,setError]=useState(false),[page,setPage]=useState(1),[more,setMore]=useState(false);
 const lock=useRef(false), mounted=useRef(true), heading=useRef<HTMLHeadingElement>(null);
 const draftId=detail?.question.reference??'new', draft=drafts[draftId]??{message:'',key:''};
 const api=useCallback(async(path='',body?:object,signal?:AbortSignal)=>{
  const response=await fetch('/api/shida/personal/support/questions'+path,{method:body?'POST':'GET',signal,cache:'no-store',headers:{'x-shida-session':binding,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error();return response.json();
 },[binding]);
 const refresh=useCallback(async(signal?:AbortSignal)=>{const result=await api(`?page=${page}`,undefined,signal);if(!signal?.aborted){setItems(result.questions);setMore(result.has_more);setLoading(false);}},[api,page]);
 useEffect(()=>{mounted.current=true;const controller=new AbortController();void api(`?page=${page}`,undefined,controller.signal).then(result=>{if(!controller.signal.aborted){setItems(result.questions);setMore(result.has_more);setLoading(false);}}).catch(()=>{if(!controller.signal.aborted){setError(true);setLoading(false);}});return()=>{mounted.current=false;controller.abort();};},[api,page]);
 useEffect(()=>{const reference=new URLSearchParams(window.location.search).get('question');if(!reference||!/^SCT_[A-Za-z0-9_-]+$/.test(reference))return;const controller=new AbortController();void api('/'+reference,undefined,controller.signal).then(value=>{if(!controller.signal.aborted){setDetail(value);setView('mine');}}).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();},[api]);
 useEffect(()=>{if(!detail)return;void api('/'+detail.question.reference+'/read',{}).catch(()=>{});},[api,detail]);
 async function run(work:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError(false);setNotice('');try{await work();}catch{if(mounted.current)setError(true);}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 function edit(message:string){setDrafts(old=>({...old,[draftId]:{message,key:crypto.randomUUID()}}));}
 async function open(reference:string){await run(async()=>{setDetail(await api('/'+reference));setView('mine');heading.current?.focus();});}
 async function submit(){await run(async()=>{const payload={message:draft.message,request_id:draft.key};let result;if(detail)result=await api('/'+detail.question.reference+'/reply',payload);else{const created=await api('',{...payload,topic,language:locale});result=await api('/'+created.question.reference);}setDrafts(old=>({...old,[draftId]:{message:'',key:''}}));setDetail(result);setView('mine');setNotice(t(detail?'saved':'sent'));await refresh();});}
 function tab(next:typeof view){setView(next);setDetail(null);setNotice('');}
 const base=`${locale==='en'?'':`/${locale}`}/shida/space`;
 const whatsapp=detail?new URL(OFFICIAL_CHANNELS.whatsapp):null;
 if(whatsapp&&detail)whatsapp.searchParams.set('text',`${t('prepared')} ${detail.question.display_reference}`);
 const when=(value:string)=>new Date(value).toLocaleString(locale==='ln'?'fr-CD':locale==='sw'?'sw-CD':locale);
 return <section className="help-questions"><p>{t('intro')}</p><nav className="help-tabs" aria-label={t('title')}>{(['ask','mine','faq'] as const).map(key=><button key={key} type="button" disabled={busy} aria-current={view===key?'page':undefined} onClick={()=>tab(key)}>{t(key)}</button>)}</nav>
 {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{t('error')} <button type="button" disabled={busy} onClick={()=>void run(()=>refresh())}>{t('retry')}</button></p>}
 {detail?<section className="help-card"><button type="button" onClick={()=>tab('mine')}>{t('back')}</button><h2 ref={heading} tabIndex={-1}>{questionSubject(detail.question.message)}</h2><div className="help-actions"><span className="help-status">{t(detail.question.status)}</span><span>{t(detail.question.topic)}</span></div><div className="help-history">{detail.messages.map(message=><article key={message.id}><header><strong>{t(message.author==='support'?'team':'you')}</strong><small>{message.channel==='whatsapp'?'WhatsApp':t(message.channel==='web'?'web':'unknown')} · <time dateTime={message.created_at}>{when(message.created_at)}</time></small></header><p>{message.message}</p></article>)}</div>
 {detail.question.status!=='closed'&&<form onSubmit={event=>{event.preventDefault();void submit();}}><label htmlFor="question-reply">{t('replyLabel')}</label><textarea id="question-reply" rows={5} disabled={busy} required maxLength={4000} value={draft.message} onChange={e=>edit(e.target.value)}/><button className="help-primary" disabled={busy||!draft.message.trim()}>{t('reply')}</button></form>}
 <div className="help-actions"><button disabled={busy} onClick={()=>void run(async()=>{await api('/'+detail.question.reference+(detail.question.status==='closed'?'/reopen':'/close'),{});setDetail(await api('/'+detail.question.reference));await refresh();})}>{t(detail.question.status==='closed'?'reopen':'complete')}</button>{whatsapp&&<a href={whatsapp.href} target="_blank" rel="noopener noreferrer">{t('whatsapp')}</a>}</div><p className="help-hint">{t('whatsappHint')}</p></section>
 :view==='ask'?<section className="help-card"><h2>{t('ask')}</h2><form onSubmit={event=>{event.preventDefault();void submit();}}><label htmlFor="question-topic">{t('topic')}</label><select id="question-topic" value={topic} disabled={busy} onChange={e=>{setTopic(e.target.value as Topic);if(draft.message)edit(draft.message);}}>{(['using_shida','features','suggestion','other'] as const).map(key=><option key={key} value={key}>{t(key)}</option>)}</select><label htmlFor="question-body">{t('question')}</label><textarea id="question-body" rows={6} disabled={busy} value={draft.message} onChange={e=>edit(e.target.value)} required maxLength={4000} aria-describedby="question-hint"/><button className="help-primary" disabled={busy||!draft.message.trim()}>{t('send')}</button><p id="question-hint" className="help-hint">{t('hint')}</p></form><a href={base+'?view=support'}>{t('report')}</a></section>
 :view==='mine'?<section className="help-card"><header className="help-actions"><h2>{t('mine')}</h2><button disabled={busy} onClick={()=>void run(()=>refresh())}>{t('retry')}</button></header>{loading?<p role="status">{t('loading')}</p>:!items.length&&!error?<p>{t('empty')}</p>:<ul className="help-list">{items.map(item=><li key={item.reference}><button className="help-question-link" disabled={busy} onClick={()=>void open(item.reference)}><strong>{questionSubject(item.message)}</strong><span>{t(item.topic)}</span></button><span className="help-status">{t(item.status)}</span></li>)}</ul>}{(page>1||more)&&<div className="help-actions"><button disabled={page===1||busy} onClick={()=>setPage(n=>n-1)}>{t('previous')}</button><span>{page}</span><button disabled={!more||busy} onClick={()=>setPage(n=>n+1)}>{t('next')}</button></div>}</section>
 :<section className="help-card"><h2>{t('faq')}</h2><details><summary>{t('faqQuestion')}</summary><p>{t('faqAnswer')}</p></details><details><summary>{t('faqProblem')}</summary><p>{t('faqProblemAnswer')}</p><a href={base+'?view=support'}>{t('report')}</a></details></section>}
 </section>;
}
