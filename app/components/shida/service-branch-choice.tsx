"use client";
import {useState} from "react";
import type {CustomerBranch} from "../../types/shida-public";
import {safePublicActionUrl} from "../../lib/safe-public-url";
export function ServiceBranchChoice({locale,branches,specified}:{locale:"fr"|"en"|"ln"|"sw";branches:CustomerBranch[];specified:boolean}){
 const [selected,setSelected]=useState("");
 const t={en:["Choose a branch to visit","Choose a branch","Continue on WhatsApp","The exact address is available after booking acceptance.","No branch is currently available."],fr:["Choisissez une succursale à visiter","Choisir une succursale","Continuer sur WhatsApp","L’adresse exacte est disponible après acceptation de la réservation.","Aucune succursale disponible actuellement."],ln:["Pona etape oyo okokende","Pona etape","Koba na WhatsApp","Adresi epesami nsima ya kondima mosala.","Etape moko te ezali sikoyo."],sw:["Chagua tawi la kutembelea","Chagua tawi","Endelea kwenye WhatsApp","Anwani kamili inapatikana baada ya kukubali nafasi.","Hakuna tawi linalopatikana sasa."]}[locale];
 if(!specified)return null;
 const branch=branches.find(row=>row.branch_ref===selected),url=safePublicActionUrl(branch?.booking_url??null);
 return <section aria-label={t[0]}><h2>{t[0]}</h2><p>{t[3]}</p>{branches.length?<><label>{t[1]}<select value={selected} onChange={event=>setSelected(event.target.value)}><option value="">{t[1]}</option>{branches.map(row=><option key={row.branch_ref} value={row.branch_ref}>{row.name} · {row.broad_area}</option>)}</select></label>{branch&&<p>📍 {branch.name} · {branch.broad_area}</p>}{url?<a className="button" href={url} target="_blank" rel="noopener noreferrer">{t[2]}</a>:<button disabled>{t[2]}</button>}</>:<p>{t[4]}</p>}</section>;
}
