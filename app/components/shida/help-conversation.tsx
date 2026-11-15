"use client";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {helpText,questionSubject,type HelpLocale} from '../../lib/help-questions-copy';
import {SpaceIcon} from './account-space-icon';
export type HelpQuestion={reference:string;display_reference:string;topic:'using_shida'|'features'|'suggestion'|'other';message:string;status:'open'|'answered'|'closed';created_at:string};
export type HelpDetail={question:HelpQuestion;messages:{id:number;author:string;message:string;channel:string;created_at:string}[]};
export function HelpConversation({detail,locale,displayName,draft,busy,ready,whatsapp,onEdit,onSubmit,onBack,onComplete}:{detail:HelpDetail;locale:HelpLocale;displayName:string;draft:string;busy:boolean;ready:boolean;whatsapp:string|null;onEdit:(value:string)=>void;onSubmit:()=>void;onBack:()=>void;onComplete:()=>void}){
 const t=(key:Parameters<typeof helpText>[1])=>helpText(locale,key),dateLocale=locale==='ln'?'fr-CD':locale==='sw'?'sw-CD':locale;
 const history=useRef<HTMLDivElement>(null),textarea=useRef<HTMLTextAreaElement>(null),composing=useRef(false),nearEnd=useRef(true),seen=useRef<Set<number>|null>(null),earlierPosition=useRef<{height:number;top:number}|null>(null);
 const [start,setStart]=useState(()=>Math.max(detail.messages.length-30,0)),[unread,setUnread]=useState(0),[announcement,setAnnouncement]=useState(0);
 const messages=[...detail.messages].sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at)||a.id-b.id),visible=messages.slice(start);
 const names=displayName.trim().split(/\s+/).filter(Boolean),initials=names.length?(Array.from(names[0])[0]+(names.length>1?Array.from(names.at(-1)!)[0]:'')).toLocaleUpperCase(locale):'?';
 const bottom=()=>{if(history.current)history.current.scrollTop=history.current.scrollHeight;nearEnd.current=true;setUnread(0);};
 useEffect(()=>{document.getElementById('help-subject')?.focus({preventScroll:true});},[]);
 useLayoutEffect(()=>{const box=history.current;if(!box)return;
  if(earlierPosition.current){box.scrollTop=earlierPosition.current.top+box.scrollHeight-earlierPosition.current.height;earlierPosition.current=null;return;}
  const newMessages=seen.current?messages.filter(m=>!seen.current!.has(m.id)):[];
  if(seen.current===null||newMessages.length&&(nearEnd.current||newMessages.at(-1)?.author==='user'))bottom();
  else if(newMessages.length)setUnread(count=>count+newMessages.length);
  if(newMessages.length)setAnnouncement(count=>count+newMessages.length);
  seen.current=new Set(messages.map(m=>m.id));
 // Synchronize scroll geometry after message/render changes, without moving the page itself.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[detail.messages,start]);
 useLayoutEffect(()=>{const field=textarea.current;if(field){field.style.height='auto';field.style.height=Math.min(field.scrollHeight,180)+'px';}},[draft]);
 const date=(value:string)=>new Date(value),valid=(value:string)=>!Number.isNaN(date(value).getTime());
 const day=(value:string)=>valid(value)?date(value).toLocaleDateString(dateLocale,{dateStyle:'long'}):t('unknownDate');
 const short=(value:string)=>valid(value)?date(value).toLocaleTimeString(dateLocale,{hour:'2-digit',minute:'2-digit'}):'';
 const full=(value:string)=>valid(value)?date(value).toLocaleString(dateLocale,{dateStyle:'full',timeStyle:'long'}):t('unknownDate');
 return <section className="help-card help-conversation" aria-labelledby="help-subject">
  <button className="help-back" type="button" disabled={busy} onClick={onBack}>← {t('mine')}</button>
  <header className="help-conversation-heading"><h2 id="help-subject" tabIndex={-1}>{questionSubject(detail.question.message)}</h2><span className="help-status">{t(detail.question.status)}</span><p>{t(detail.question.topic)}</p></header>
  <div className="help-history" ref={history} role="region" aria-label={t('conversation')} tabIndex={0} onScroll={()=>{const box=history.current!;nearEnd.current=box.scrollHeight-box.scrollTop-box.clientHeight<64;if(nearEnd.current)setUnread(0);}}>
   {start>0&&<button className="help-earlier" type="button" onClick={()=>{const box=history.current!;earlierPosition.current={height:box.scrollHeight,top:box.scrollTop};setStart(index=>Math.max(index-30,0));}}>{t('earlier')}</button>}
   {!messages.length&&<p>{t('noMessages')}</p>}
   {visible.map((message,index)=>{const user=message.author!=='support',dateChanged=index===0||day(visible[index-1].created_at)!==day(message.created_at);return <div key={message.id}>
    {dateChanged&&<p className="help-date"><span>{day(message.created_at)}</span></p>}
    <article className={`help-message ${user?'help-message-user':'help-message-team'}`}>
     <span className="help-avatar" aria-hidden="true">{user?initials:<span className="help-team-icon">?</span>}</span>
     <div className="help-message-content"><div className="help-bubble"><strong>{t(user?'you':'team')}</strong><p>{message.message}</p></div><div className="help-message-meta"><time dateTime={message.created_at} title={full(message.created_at)} aria-label={full(message.created_at)}>{short(message.created_at)}</time>{message.channel==='whatsapp'&&<span className="help-source"> · WhatsApp</span>}</div></div>
    </article></div>;})}
  </div>
  <p className="help-announcement" role="status" aria-live="polite" aria-atomic="true">{announcement?`${t('newMessages')} (${announcement})`:null}</p>
  {unread>0&&<button type="button" className="help-new-messages" onClick={bottom}>{t('newMessages')} ({unread}) ↓</button>}
  {detail.question.status!=='closed'&&<form className="help-reply-form" onSubmit={event=>{event.preventDefault();if(!composing.current)onSubmit();}}><label htmlFor="question-reply">{t('replyLabel')}</label><div className="help-composer"><textarea ref={textarea} id="question-reply" rows={2} placeholder={t('placeholder')} disabled={busy||!ready} required maxLength={4000} value={draft} onChange={e=>onEdit(e.target.value)} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}}/><button type="submit" className="help-primary" disabled={busy||!ready||!draft.trim()}><SpaceIcon name="send"/>{t(busy?'sending':'sendReply')}</button></div></form>}
  <div className="help-actions help-conversation-actions"><button type="button" disabled={busy} onClick={onComplete}><SpaceIcon name="check"/>{t(detail.question.status==='closed'?'reopen':'complete')}</button>{whatsapp&&<a href={whatsapp} target="_blank" rel="noopener noreferrer"><SpaceIcon name="whatsapp"/>{t('continueWhatsapp')}</a>}</div><p className="help-hint">{t('whatsappHint')}</p>
 </section>;
}
