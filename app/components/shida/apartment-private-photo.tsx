'use client';
import {useEffect,useState} from 'react';
export function PrivatePhoto({listing,reference,binding,label}:{listing:string;reference:string|null;binding:string;label:string}) {
 const [url,setUrl] = useState<string|null>(null);
 useEffect(() => {let alive = true,object:string|null = null;const controller = new AbortController();
  if(reference && /^APF_[a-f0-9]{32}$/.test(reference)) void fetch(`/api/shida/personal/apartments/${listing}/photos/${reference}/`,{cache:'no-store',headers:{'x-shida-session':binding},signal:controller.signal}).then(async response => {if(!response.ok)throw Error();const blob = await response.blob();if(alive){object = URL.createObjectURL(blob);setUrl(object);}}).catch(() => {});
  return () => {alive = false;controller.abort();if(object)URL.revokeObjectURL(object);};
 },[listing,reference,binding]);
 // Authenticated preview is a short-lived local blob, never a public provider URL.
 // eslint-disable-next-line @next/next/no-img-element
 return url ? <img src={url} alt={label} width={160} height={120}/> : <span>{label}</span>;
}
