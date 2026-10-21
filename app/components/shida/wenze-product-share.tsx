"use client";
import {useEffect,useId,useRef,useState} from 'react';
import QRCode from 'qrcode';
import copy from '@/app/lib/wenze-editor-copy.json';
export function WenzeProductShare({locale,data,visible,onClose}:{locale:keyof typeof copy;data:Record<string,unknown>;visible:boolean;onClose:()=>void}){
 const t=copy[locale],dialog=useRef<HTMLDialogElement>(null),canvas=useRef<HTMLCanvasElement>(null),title=useId();
 const [message,setMessage]=useState('');
 let url='';try{const parsed=new URL(String(data.public_detail_url||''));if(parsed.protocol==='https:')url=parsed.href;}catch{}
 useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close();},[]);
 useEffect(()=>{if(url&&visible&&canvas.current)void QRCode.toCanvas(canvas.current,url,{width:180,margin:2}).catch(()=>setMessage(t.noLink));},[url,visible,t.noLink]);
 return <dialog ref={dialog} className="wz-confirm wz-share-dialog" aria-labelledby={title} onCancel={onClose}>
  <h2 id={title}>{t.share} · {String(data.name||'')}</h2>
  {!visible?<p>{t.hidden}</p>:!url?<p role="alert">{t.noLink}</p>:<>
   <label>{t.link}<input readOnly value={url} onFocus={e=>e.target.select()}/></label>
   <canvas ref={canvas} aria-label={t.link} role="img"/>
   <div className="wz-actions"><a href={url} target="_blank" rel="noopener noreferrer">{t.view}</a><button onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage(t.copied);}catch{setMessage(t.copyFailed);}}}>{t.copy}</button></div>
  </>}
  {message&&<p role="status">{message}</p>}<button autoFocus onClick={onClose}>{t.close}</button>
 </dialog>;
}
