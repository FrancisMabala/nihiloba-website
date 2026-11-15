'use client';
import {useEffect,useState} from 'react';
import {restorePersonalSession} from '../../lib/personal-session-browser';
import {individualApplicationCopy} from '../../lib/individual-application-copy';
import {listingText,type MissionLocale} from '../../lib/personal-missions-copy';
import {candidateApplicationPath} from './candidate-employment';
export function IndividualJobAction({locale,reference,open}:{locale:MissionLocale;reference:string;open:boolean}){
 const [application,setApplication]=useState<string|null>(null),c=individualApplicationCopy[locale],prefix=locale==='en'?'':'/'+locale;
 useEffect(()=>{const ctrl=new AbortController();void restorePersonalSession(ctrl.signal).then(async session=>{const response=await fetch('/api/shida/personal/job-offer/?'+new URLSearchParams({kind:'apply',offer:reference}),{cache:'no-store',signal:ctrl.signal,headers:{'X-Shida-Session':session.binding}});if(response.ok){const value=await response.json();if(!ctrl.signal.aborted&&typeof value.application==='string')setApplication(value.application);}}).catch(()=>{});return()=>ctrl.abort();},[reference]);
 return application?<a className="button button-primary" href={candidateApplicationPath(locale,application)}>{c.application}</a>:open?<a className="button button-primary" href={prefix+'/shida/space?'+new URLSearchParams({view:'job-offer',kind:'apply',offer:reference})}>{listingText(locale,'apply')}</a>:<a className="button button-primary" href={prefix+'/shida/emplois'}>{c.browse}</a>;
}
