'use client';
import {useRef,type ReactNode} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
export function AccountSetting({title,status,icon='settings',cancel,onCancel,children}:{title:string;status?:string;icon?:SpaceIconName;cancel?:string;onCancel?:()=>void;children:ReactNode}){
 const panel=useRef<HTMLDetailsElement>(null);
 return <details ref={panel} name="account-security" className="space-security-setting"><summary><SpaceIcon name={icon}/><span>{title}</span>{status&&<small>{status}</small>}<span className="space-setting-chevron" aria-hidden="true"/></summary><div className="space-security-detail">{children}{cancel&&<button type="button" className="space-setting-cancel" onClick={()=>{onCancel?.();if(panel.current){panel.current.open=false;panel.current.querySelector('summary')?.focus();}}}>{cancel}</button>}</div></details>;
}
