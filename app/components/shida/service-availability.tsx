"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { safePublicActionUrl } from "../../lib/safe-public-url";
import type { ServiceAvailability, ServiceOffering } from "../../types/shida-public";
import { formatServiceDuration } from "./service-format";

const copy={
  en:{stepDate:"2. Choose a date and time",date:"Choose a date and time",stepFlexible:"2. Book this service",flexibleTitle:"Book this service",selectOption:"Choose an option first to continue.",selection:"Your selection",loading:"Availability could not be loaded. Please try again.",empty:"No available times in this period.",choose:"Select an available time to continue.",book:"Book on SHIDA",confirm:"The provider will confirm your requested time in SHIDA.",previous:"Previous 31 days",next:"Next 31 days",flexible:"Continue booking in SHIDA to choose your preferred date and time.",unavailable:"The SHIDA booking link is temporarily unavailable."},
  fr:{stepDate:"2. Choisissez une date et une heure",date:"Choisissez une date et une heure",stepFlexible:"2. Réserver ce service",flexibleTitle:"Réserver ce service",selectOption:"Choisissez d’abord une option pour continuer.",selection:"Votre choix",loading:"Les disponibilités n’ont pas pu être chargées. Veuillez réessayer.",empty:"Aucun créneau disponible pour cette période.",choose:"Sélectionnez un créneau disponible pour continuer.",book:"Réserver sur SHIDA",confirm:"Le prestataire confirmera l’heure demandée dans SHIDA.",previous:"31 jours précédents",next:"31 jours suivants",flexible:"Continuez la réservation dans SHIDA pour choisir la date et l’heure souhaitées.",unavailable:"Le lien de réservation SHIDA est temporairement indisponible."},
} as const;

function dayLabel(date:string,locale:Locale):string{const value=new Date(`${date}T12:00:00Z`);return new Intl.DateTimeFormat(locale,{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"}).format(value);}
function offsetDate(date:string,days:number):string{const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);}
function periodHref(path:string,from:string,option:string|null):string{const params=new URLSearchParams({from});if(option)params.set("option",option);return `${path}?${params}`;}
function optionPrice(option:ServiceOffering):string|null{if(!option.price)return null;return /[A-Za-z]{3}|[$€£]|CDF/i.test(option.price)?option.price:`${option.price}${option.currency?` ${option.currency}`:""}`;}
export function serviceSlotActionUrl(value:string|null):string|null{return safePublicActionUrl(value);}

export function ServiceAvailabilityPanel({locale,availability,bookingUrl,path,requiresOption=false,selectedOption=null,flexible=false}:{locale:Locale;availability:ServiceAvailability|null;bookingUrl:string|null;path:string;requiresOption?:boolean;selectedOption?:ServiceOffering|null;flexible?:boolean}){
  const t=copy[locale],[selectedDate,setSelectedDate]=useState<string|null>(null),[selectedUrl,setSelectedUrl]=useState<string|null>(null);
  const heading=flexible?(requiresOption?t.stepFlexible:t.flexibleTitle):(requiresOption?t.stepDate:t.date);
  const dates=useMemo(()=>{if(!availability?.from||!availability.to)return [];const result:string[]=[];for(let value=new Date(`${availability.from}T12:00:00Z`),end=new Date(`${availability.to}T12:00:00Z`);value<=end;value.setUTCDate(value.getUTCDate()+1))result.push(value.toISOString().slice(0,10));return result;},[availability]);
  const summary=selectedOption?<div className="service-selection-summary"><span>{t.selection}</span><strong>{selectedOption.name}</strong><small>{[optionPrice(selectedOption),selectedOption.duration_minutes!=null?formatServiceDuration(selectedOption.duration_minutes):null].filter(Boolean).join(" · ")}</small></div>:null;
  if(requiresOption&&!selectedOption)return <section className="service-availability" aria-labelledby="availability-title"><h2 id="availability-title">{heading}</h2><p>{t.selectOption}</p><button className="button" disabled>{t.book}</button></section>;
  if(!availability)return <section className="service-availability" aria-labelledby="availability-title"><h2 id="availability-title">{heading}</h2>{summary}<p role="status">{t.loading}</p></section>;
  if(availability.availability_mode==="flexible"){const action=safePublicActionUrl(availability.booking_url)||safePublicActionUrl(bookingUrl);return <section className="service-availability" aria-labelledby="availability-title"><h2 id="availability-title">{heading}</h2>{summary}<p>{t.flexible}</p>{availability.requested_time_requires_provider_confirmation&&<p className="service-confirmation-note">{t.confirm}</p>}{action?<a className="button" href={action} target="_blank" rel="noopener noreferrer">{t.book}</a>:<p className="marketplace-action-unavailable">{t.unavailable}</p>}</section>;}
  const availableDates=new Set(availability.slots.filter((slot)=>slot.is_available).map((slot)=>slot.date)),slots=availability.slots.filter((slot)=>slot.is_available&&slot.date===selectedDate),action=serviceSlotActionUrl(selectedUrl),previous=availability.from?offsetDate(availability.from,-31):null,next=availability.to?offsetDate(availability.to,1):null;
  return <section className="service-availability" aria-labelledby="availability-title"><h2 id="availability-title">{heading}</h2>{summary}
    {availableDates.size?<><div className="service-date-grid" aria-label={heading}>{dates.map((date)=>{const available=availableDates.has(date);return <button type="button" aria-pressed={selectedDate===date} disabled={!available} aria-label={`${dayLabel(date,locale)}${available?"":" — unavailable"}`} className={selectedDate===date?"is-selected":""} key={date} onClick={()=>{setSelectedDate(date);setSelectedUrl(null);}}>{dayLabel(date,locale)}</button>;})}</div>
      {selectedDate?<div className="service-slot-grid" role="group" aria-label={dayLabel(selectedDate,locale)}>{slots.map((slot)=><button type="button" aria-pressed={selectedUrl===slot.booking_url} className={selectedUrl===slot.booking_url?"is-selected":""} key={`${slot.date}-${slot.start_time}`} onClick={()=>setSelectedUrl(slot.booking_url)}>{slot.start_time}–{slot.end_time}</button>)}</div>:<p>{t.choose}</p>}
      {availability.requested_time_requires_provider_confirmation&&<p className="service-confirmation-note">{t.confirm}</p>}{action?<a className="button" href={action} target="_blank" rel="noopener noreferrer">{t.book}</a>:<button className="button" disabled>{t.book}</button>}
    </>:<p role="status">{t.empty}</p>}
    <nav className="service-period-nav" aria-label={heading}>{previous&&previous>=new Date().toISOString().slice(0,10)&&<Link href={periodHref(path,previous,selectedOption?.public_ref||null)}>{t.previous}</Link>}{next&&<Link href={periodHref(path,next,selectedOption?.public_ref||null)}>{t.next}</Link>}</nav>
  </section>;
}
