"use client";
import {useEffect, useRef, useState} from "react";
import {TEST_MARKETPLACE_MODE, testMarketplaceCopy} from "../../lib/test-marketplace";
import {leaveWork} from "../../lib/restaurant-work";
import {PERSONAL_SESSION_EVENT} from "../../lib/personal-session-browser";
import {usePathname} from "next/navigation";

export function TestMarketplaceControl({locale, eligible, binding, checked}: {locale:keyof typeof testMarketplaceCopy; eligible:boolean; binding?:string; checked:boolean}) {
  const t = testMarketplaceCopy[locale];
  const pathname=usePathname();
  const [enabled,setEnabled] = useState(false), [busy,setBusy] = useState(false), [failed,setFailed] = useState(false);
  const exiting=useRef(false);
  useEffect(()=>{
    const active=()=>document.cookie.split(";").some(part=>part.trim()===`${TEST_MARKETPLACE_MODE}=1`);
    const initial=active(); queueMicrotask(()=>setEnabled(initial));
    const refresh=()=>{if(initial&&!active())window.location.replace(window.location.href);};
    window.addEventListener(PERSONAL_SESSION_EVENT,refresh);window.addEventListener('storage',refresh);
    window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);
    const timer=window.setInterval(refresh,60000);
    return()=>{clearInterval(timer);window.removeEventListener(PERSONAL_SESSION_EVENT,refresh);window.removeEventListener('storage',refresh);window.removeEventListener('pageshow',refresh);window.removeEventListener('focus',refresh);};
  },[]);
  useEffect(()=>{
    if(!enabled||!checked||eligible||exiting.current)return;
    exiting.current=true;
    void fetch('/api/shida/test-marketplace/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:false})})
      .then(response=>{if(!response.ok)throw Error();window.location.replace(window.location.href);})
      .catch(()=>{exiting.current=false;setFailed(true);});
  },[enabled,checked,eligible]);
  if ((!eligible && !enabled)||!/^\/(?:en\/|fr\/|ln\/|sw\/)?shida\/(?:wenze|hotels|restaurants|services|businesses)(?:\/|$)/.test(pathname)) return null;
  async function change() {
    if (busy || !(await leaveWork())) return;
    setBusy(true); setFailed(false);
    try {
      const response = await fetch("/api/shida/test-marketplace/", {method:"POST", cache:"no-store", headers:{"Content-Type":"application/json", ...(binding?{"x-shida-session":binding}:{})}, body:JSON.stringify({enabled:!enabled})});
      if (!response.ok) throw Error();
      const market = window.location.pathname.match(/^((?:\/(?:en|fr|ln|sw))?\/shida\/(?:wenze|hotels|restaurants|services))(?:\/|$)/)?.[1];
      window.location.assign(market ?? `${locale==="en"?"":`/${locale}`}/shida/wenze/`);
    } catch {setFailed(true);setBusy(false);}
  }
  return <details className="shida-test-marketplace-control"><summary>{enabled?t.title:t.open}</summary>
    <div className="shida-test-marketplace-panel">
    <p>{enabled?t.help:t.publicHelp}</p>
    <button type="button" disabled={busy} onClick={()=>void change()}>{busy?t.working:enabled?t.close:t.open}</button>
    {failed&&<p role="alert">{t.failed}</p>}
    </div>
  </details>;
}
