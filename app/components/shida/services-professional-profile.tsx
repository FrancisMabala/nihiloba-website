"use client";
import {useState} from "react";
import Link from "next/link";
import {useWorkDraft,leaveWork} from "@/app/lib/restaurant-work";
import {professionalCopy} from "@/app/lib/services-professional-copy";
import {MarketplaceImage} from "./marketplace-image";
export type ProfessionalProfile={name:string;bio:string;photo:string|null;social_link:string|null};
export function ServicesProfessionalProfile({profile,locale,providerRef,publicAvailable,area,busy,onSave,linkLabel}:{profile:ProfessionalProfile;locale:keyof typeof professionalCopy;providerRef:string;publicAvailable:boolean;area:string;busy:boolean;linkLabel:string;onSave:(value:{name:string;bio:string;social_link:string})=>Promise<boolean>}){
 const t=professionalCopy[locale],[editing,setEditing]=useState(false),[draft,setDraft]=useState({name:profile.name,bio:profile.bio||"",social_link:profile.social_link||""});
 const dirty=editing&&(draft.name!==profile.name||draft.bio!==(profile.bio||"")||draft.social_link!==(profile.social_link||""));
 useWorkDraft(dirty,t.shared);
 return <section className="svc-professional-card"><div className="svc-professional-summary"><div className="svc-professional-photo"><MarketplaceImage src={profile.photo} alt={profile.name} fallback={profile.name.slice(0,1)} sizes="112px"/></div><div><p className="svc-kicker">{t.title}</p><h2>{profile.name}</h2>{area&&<p>{area}</p>}<p>{profile.bio||t.emptyBio}</p></div><div className="svc-profile-actions"><button type="button" disabled={busy} onClick={()=>{if(!leaveWork())return;setDraft({name:profile.name,bio:profile.bio||"",social_link:profile.social_link||""});setEditing(true);}}>{t.edit}</button>{publicAvailable&&<Link href={`${locale==="en"?"":`/${locale}`}/shida/services/providers/${encodeURIComponent(providerRef)}`} prefetch={false}>{t.title} ↗</Link>}</div></div>
 {editing&&<form className="svc-profile-form" onSubmit={async event=>{event.preventDefault();if(await onSave(draft))setEditing(false);}}><p>{t.shared}</p><label>{t.name}<input required maxLength={200} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>{t.bio}<textarea rows={3} maxLength={2000} value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})}/></label><label>{linkLabel}<input type="url" maxLength={2000} value={draft.social_link} onChange={e=>setDraft({...draft,social_link:e.target.value})}/></label><p className="svc-field-hint">{t.photo}</p><div className="svc-profile-actions"><button className="svc-primary" disabled={busy}>{t.save}</button><button type="button" disabled={busy} onClick={()=>{if(leaveWork())setEditing(false);}}>{t.cancel}</button></div></form>}
 <p className="svc-professional-notice">{t.notice}</p></section>;
}
