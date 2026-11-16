'use client';
import type {ReactNode} from 'react';
import {personalSpaceMobileCopy} from '../../lib/personal-space-mobile-copy';
/** Native disclosure keeps secondary actions reachable without nested card links. */
export function RecordActions({locale,name,children}:{locale:keyof typeof personalSpaceMobileCopy;name:string;children:ReactNode}){
 return <details className="record-actions" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}} onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))event.currentTarget.open=false;}}>
  <summary aria-label={`${personalSpaceMobileCopy[locale].actions} — ${name}`}><span aria-hidden="true">•••</span></summary><div>{children}</div>
 </details>;
}
