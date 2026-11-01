"use client";
import {useState} from 'react';
import {storefrontCopy} from '../../lib/professional-storefront';
export function ProfessionalShare({locale,path,name}:{locale:keyof typeof storefrontCopy;path:string;name:string}){
 const [message,setMessage]=useState(''),t=storefrontCopy[locale];
 async function share(){const url=new URL(path,window.location.origin).href;try{if(navigator.share)await navigator.share({title:name,url});else{await navigator.clipboard.writeText(url);setMessage(t.copied);}}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setMessage(t.failed);}}
 return <div className="professional-share"><button type="button" onClick={()=>void share()}><span aria-hidden="true">↗</span> {t.share}</button>{message&&<small role="status">{message}</small>}</div>;
}
