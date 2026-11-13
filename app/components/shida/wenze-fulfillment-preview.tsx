import {useEffect,useState,type ReactNode} from 'react';

export function FulfillmentPreview({title,children}:{title:string;children:ReactNode}){
 const [desktop,setDesktop]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(min-width: 960px)');
  const sync=()=>setDesktop(media.matches);
  sync();media.addEventListener('change',sync);
  return ()=>media.removeEventListener('change',sync);
 },[]);
 return desktop?<aside className="ws-customer-preview"><h3>{title}</h3>{children}</aside>:
  <details className="ws-customer-preview"><summary>{title}</summary>{children}</details>;
}
