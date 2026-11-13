'use client';

import {useEffect, useRef} from 'react';

export function EmployerPageView({reference}: {reference:string}) {
  const observed = useRef('');
  useEffect(() => {
    function observe() {
      if (document.visibilityState !== 'visible' || observed.current === reference ||
          navigator.doNotTrack === '1' || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl) return;
      if (!window.crypto?.randomUUID) return;
      observed.current = reference;
      const headers: Record<string,string> = {'X-Shida-Event': crypto.randomUUID()};
      try {
        const key = 'shida_employer_visit_'+reference;
        let visitor = sessionStorage.getItem(key);
        if (!visitor) { visitor = crypto.randomUUID(); sessionStorage.setItem(key,visitor); }
        headers['X-Shida-Visitor'] = visitor;
      } catch { /* The opening can still be counted when session storage is unavailable. */ }
      void fetch('/api/shida/employer-pages/'+encodeURIComponent(reference)+'/view/', {
        method:'POST', credentials:'omit', headers, keepalive:true,
      }).catch(()=>{ /* Measurement must never interrupt browsing. */ });
    }
    observe();
    document.addEventListener('visibilitychange',observe);
    return () => document.removeEventListener('visibilitychange',observe);
  },[reference]);
  return null;
}
