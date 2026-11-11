'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
export function AccountSetting({id,title,status,icon='settings',cancel,onCancel,children}:{id?:string;title:string;status?:string;icon?:SpaceIconName;cancel?:string;onCancel?:()=>void;children:ReactNode}){
 const panel=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const open=()=>{if(id&&location.hash==='#'+id&&panel.current){panel.current.open=true;panel.current.scrollIntoView({block:'center'});panel.current.querySelector<HTMLElement>('input,button')?.focus({preventScroll:true});}};open();window.addEventListener('hashchange',open);return()=>window.removeEventListener('hashchange',open);},[id]);
 return <details id={id} ref={panel} name="account-security" className="space-security-setting"><summary><SpaceIcon name={icon}/><span>{title}</span>{status&&<small>{status}</small>}<span className="space-setting-chevron" aria-hidden="true"/></summary><div className="space-security-detail">{children}{cancel&&<button type="button" className="space-setting-cancel" onClick={()=>{onCancel?.();if(panel.current){panel.current.open=false;panel.current.querySelector('summary')?.focus();}}}>{cancel}</button>}</div></details>;
}
