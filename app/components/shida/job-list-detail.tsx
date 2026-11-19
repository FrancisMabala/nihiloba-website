"use client";

import {useId,useRef,useState,useSyncExternalStore,type MouseEvent} from "react";
import type {ServiceLocale} from "../../lib/services-i18n";
import type {PublicJobSummary} from "../../types/shida-public";
import {compactMarketplaceCopy} from "../../lib/compact-marketplace-copy";
import {jobLocation} from "../../lib/job-location";
import {rememberJobResults} from "../../lib/job-results-return";
import {JobAccessLink} from "./job-access";
import {JobDetailPage} from "./job-detail-reader";
import {JobCategoryIcon} from "./job-discovery-ui";
import {cardCompensation,contractLabel,copy,employerPath,jobFactText,jobPath,organizationLabel,originLabel} from "./job-presentation";
import {plainOfferText} from "./offer-text";
import "./job-list-detail.css";

const desktopQuery="(min-width: 1024px)";
function subscribeToDesktop(notify:()=>void){const media=window.matchMedia(desktopQuery);media.addEventListener("change",notify);return ()=>media.removeEventListener("change",notify);}
const isDesktop=()=>window.matchMedia(desktopQuery).matches;
const serverDesktop=()=>false;

export function selectsJobPane(event:Pick<MouseEvent<HTMLAnchorElement>,"button"|"ctrlKey"|"metaKey"|"shiftKey"|"altKey">,desktop:boolean){
  return desktop&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey;
}

function JobPreview({item,locale}:{item:PublicJobSummary;locale:ServiceLocale}){
  const t=copy[locale],location=jobLocation(item),salary=cardCompensation(item,locale),employer=employerPath(locale,item.employer);
  // Only the public preview fields belong in the anonymous pane. Full text and
  // application destinations still come exclusively from the protected reader.
  const summary=plainOfferText(item.summary_preview||item.description_preview||"");
  return <div className="job-list-preview">
    <span className="job-list-type">{item.origin==="external"?originLabel(item,locale):item.offer_type==="individual"?compactMarketplaceCopy[locale].individualOffer:compactMarketplaceCopy[locale].professionalOffer}</span>
    <h2>{item.title}</h2>
    {item.offer_type==="enterprise"&&(employer?<a className="job-list-employer" href={employer}>{item.employer.name}</a>:<p className="job-list-employer">{item.employer.name}</p>)}
    {location&&<p>{location}</p>}
    <dl className="job-list-facts">
      {(item.contract_type||item.contract_type_raw)&&<div><dt>{t.contract}</dt><dd>{contractLabel(item.contract_type||item.contract_type_raw,locale)}</dd></div>}
      {(item.work_mode||item.work_mode_raw)&&<div><dt>{t.mode}</dt><dd>{jobFactText(item.work_mode||item.work_mode_raw||"",locale)}</dd></div>}
      {salary&&<div><dt>{t.compensation}</dt><dd>{salary}</dd></div>}
    </dl>
    {item.deadline_label&&<p className="job-list-deadline">{item.deadline_label}</p>}
    {summary&&<p className="job-list-summary">{summary}</p>}
    <JobAccessLink href={jobPath(locale,item)} primary>{t.details}</JobAccessLink>
  </div>;
}

export function JobListDetail({items,locale}:{items:PublicJobSummary[];locale:ServiceLocale}){
  const [selected,setSelected]=useState(items[0]?.public_ref);
  const desktop=useSyncExternalStore(subscribeToDesktop,isDesktop,serverDesktop),paneId=useId(),pane=useRef<HTMLElement>(null);
  const current=items.find(item=>item.public_ref===selected)||items[0];
  if(!current)return null;
  function select(event:MouseEvent<HTMLAnchorElement>,item:PublicJobSummary){
    if(!selectsJobPane(event,isDesktop()))return;
    event.preventDefault();rememberJobResults(jobPath(locale,item));setSelected(item.public_ref);
    // Keyboard activation moves directly into the detail region. Pointer users
    // keep their list position; the page has no nested scrolling containers.
    if(event.detail===0)requestAnimationFrame(()=>pane.current?.focus({preventScroll:true}));
  }
  const preview=<JobPreview item={current} locale={locale}/>;
  return <div className="job-list-detail">
    <ul className="job-list-rows" aria-label={copy[locale].jobs}>
      {items.map(item=>{
        const salary=cardCompensation(item,locale),location=jobLocation(item),trust=organizationLabel(item,locale);
        return <li key={item.public_ref}>
          <JobAccessLink href={jobPath(locale,item)} className="job-list-row" current={desktop&&item.public_ref===current.public_ref} controls={desktop?paneId:undefined} onClick={event=>select(event,item)}>
            <JobCategoryIcon category={item.professional_category||item.category} individual={item.offer_type==="individual"}/>
            <div className="job-list-row-body">
              <span className="job-list-type">{item.offer_type==="individual"?compactMarketplaceCopy[locale].individualOffer:compactMarketplaceCopy[locale].professionalOffer}</span>
              <h3>{item.title}</h3>
              {item.offer_type==="enterprise"&&<p className="job-list-employer">{item.employer.name}</p>}
              {location&&<p className="job-list-location">{location}</p>}
              <div className="job-list-meta">{(item.contract_type||item.contract_type_raw)&&<span>{contractLabel(item.contract_type||item.contract_type_raw,locale)}</span>}{(item.work_mode||item.work_mode_raw)&&<span>{jobFactText(item.work_mode||item.work_mode_raw||"",locale)}</span>}{item.origin==="external"&&<span>{originLabel(item,locale)}</span>}{trust&&<span>{trust}</span>}</div>
              {salary&&<p className="job-list-salary">{salary}</p>}
              {item.deadline_label&&<p className="job-list-deadline">{item.deadline_label}</p>}
              {["expired","closed","archived","source_invalid"].includes(item.lifecycle_state)&&<strong className="job-list-closed">{copy[locale].closed}</strong>}
            </div>
            <span className="job-list-arrow" aria-hidden="true">→</span>
          </JobAccessLink>
        </li>;
      })}
    </ul>
    <aside ref={pane} id={paneId} className="job-list-pane" tabIndex={-1} aria-label={`${copy[locale].details}: ${current.title}`}>
      {desktop?<JobDetailPage key={`${locale}:${current.public_ref}`} locale={locale} slug={current.slug||current.public_ref} embedded preview={preview}/>:preview}
    </aside>
  </div>;
}
