"use client";
import {useEffect,useId,useRef,useState} from 'react';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import {sellerText} from '@/app/lib/wenze-seller-copy';
export function useWenzeConfirm(locale:WenzeLocale){
 const titleId=useId();
 const [content,setContent]=useState<{title:string;help?:string}|null>(null);
 const resolve=useRef<((value:boolean)=>void)|null>(null),dialog=useRef<HTMLDialogElement>(null);
 const finish=(value:boolean)=>{resolve.current?.(value);resolve.current=null;dialog.current?.close();setContent(null);};
 useEffect(()=>{if(content)dialog.current?.showModal();},[content]);
 useEffect(()=>()=>{resolve.current?.(false);},[]);
 const confirm=(title:string,help?:string)=>new Promise<boolean>(done=>{resolve.current=done;setContent({title,help});});
 const confirmation=<dialog ref={dialog} className="wz-confirm" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();finish(false);}}><h2 id={titleId}>{content?.title}</h2>{content?.help&&<p>{content.help}</p>}<div className="wz-actions"><button type="button" autoFocus onClick={()=>finish(false)}>{sellerText(locale,'cancel')}</button><button type="button" className="seller-primary" onClick={()=>finish(true)}>{content?.title}</button></div></dialog>;
 return {confirm,confirmation};
}
