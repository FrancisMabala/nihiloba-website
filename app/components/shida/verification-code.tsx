'use client';
import {useState} from 'react';
// One semantic input preserves native paste, deletion, keyboard and OTP autofill.
// Six visual cells never receive or store separate authentication secrets.
export function VerificationCode({id,value,onChange,disabled,invalid,label}:{id:string;value:string;onChange:(value:string)=>void;disabled:boolean;invalid:boolean;label:string}){
 const [focused,setFocused]=useState(false);
 return <div className="auth-code"><div className="auth-code-cells" aria-hidden="true">{Array.from({length:6},(_,i)=><span key={i} className={focused&&i===Math.min(value.length,5)?'active':''}>{value[i]??''}</span>)}</div><input id={id} aria-label={label} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={value} disabled={disabled} aria-invalid={invalid} aria-describedby={invalid?`${id}-error`:undefined} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onChange={e=>onChange(e.target.value.replace(/[^0-9]/g,'').slice(0,6))}/></div>;
}
