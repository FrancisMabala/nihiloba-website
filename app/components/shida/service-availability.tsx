"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { safePublicActionUrl } from "../../lib/safe-public-url";
import type { ServiceAvailability } from "../../types/shida-public";

const copy = {
  en: { title:"Choose a date and time", loading:"Availability could not be loaded. Please try again.", empty:"No available times in this period.", choose:"Select an available time to continue.", continue:"Continue with this time on SHIDA", confirm:"The provider will confirm your requested time in SHIDA.", previous:"Previous 31 days", next:"Next 31 days", flexible:"Contact the provider on SHIDA to agree on a time.", contact:"Contact provider on SHIDA", unavailable:"The SHIDA booking link is temporarily unavailable." },
  fr: { title:"Choisissez une date et une heure", loading:"Les disponibilités n’ont pas pu être chargées. Veuillez réessayer.", empty:"Aucun créneau disponible pour cette période.", choose:"Sélectionnez un créneau disponible pour continuer.", continue:"Continuer avec ce créneau sur SHIDA", confirm:"Le prestataire confirmera l’heure demandée dans SHIDA.", previous:"31 jours précédents", next:"31 jours suivants", flexible:"Contactez le prestataire sur SHIDA pour convenir d’une heure.", contact:"Contacter le prestataire sur SHIDA", unavailable:"Le lien de réservation SHIDA est temporairement indisponible." },
} as const;

function dayLabel(date:string,locale:Locale):string { const value=new Date(`${date}T12:00:00Z`);return new Intl.DateTimeFormat(locale,{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"}).format(value); }
function offsetDate(date:string,days:number):string { const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10); }
export function serviceSlotActionUrl(value:string|null):string|null { return safePublicActionUrl(value); }

export function ServiceAvailabilityPanel({locale,availability,bookingUrl,path}:{locale:Locale;availability:ServiceAvailability|null;bookingUrl:string|null;path:string}) {
  const t=copy[locale], [selectedDate,setSelectedDate]=useState<string|null>(null),[selectedUrl,setSelectedUrl]=useState<string|null>(null);
  const dates=useMemo(()=>{if(!availability?.from||!availability.to)return [];const result:string[]=[];for(let value=new Date(`${availability.from}T12:00:00Z`),end=new Date(`${availability.to}T12:00:00Z`);value<=end;value.setUTCDate(value.getUTCDate()+1))result.push(value.toISOString().slice(0,10));return result;},[availability]);
  if(!availability)return <section className="service-availability" aria-labelledby="availability-title"><h2 id="availability-title">{t.title}</h2><p role="status">{t.loading}</p></section>;
  if(availability.availability_mode==="flexible") { const action=safePublicActionUrl(availability.booking_url)||safePublicActionUrl(bookingUrl);return <section className="service-availability" aria-labelledby="availability-title"><h2 id="availability-title">{t.title}</h2><p>{t.flexible}</p>{availability.requested_time_requires_provider_confirmation&&<p className="service-confirmation-note">{t.confirm}</p>}{action?<a className="button" href={action} target="_blank" rel="noopener noreferrer">{t.contact}</a>:<p className="marketplace-action-unavailable">{t.unavailable}</p>}</section>; }
  const availableDates=new Set(availability.slots.filter((slot)=>slot.is_available).map((slot)=>slot.date));
  const slots=availability.slots.filter((slot)=>slot.is_available&&slot.date===selectedDate);
  const action=serviceSlotActionUrl(selectedUrl);
  const previous=availability.from?offsetDate(availability.from,-31):null,next=availability.to?offsetDate(availability.to,1):null;
  return <section className="service-availability" aria-labelledby="availability-title"><h2 id="availability-title">{t.title}</h2>
    {availableDates.size?<><div className="service-date-grid" aria-label={t.title}>{dates.map((date)=>{const available=availableDates.has(date);return <button type="button" aria-pressed={selectedDate===date} disabled={!available} aria-label={`${dayLabel(date,locale)}${available?"":" — unavailable"}`} className={selectedDate===date?"is-selected":""} key={date} onClick={()=>{setSelectedDate(date);setSelectedUrl(null);}}>{dayLabel(date,locale)}</button>;})}</div>
      {selectedDate?<div className="service-slot-grid" role="group" aria-label={dayLabel(selectedDate,locale)}>{slots.map((slot)=><button type="button" aria-pressed={selectedUrl===slot.booking_url} className={selectedUrl===slot.booking_url?"is-selected":""} key={`${slot.date}-${slot.start_time}`} onClick={()=>setSelectedUrl(slot.booking_url)}>{slot.start_time}–{slot.end_time}</button>)}</div>:<p>{t.choose}</p>}
      {availability.requested_time_requires_provider_confirmation&&<p className="service-confirmation-note">{t.confirm}</p>}
      {action?<a className="button" href={action} target="_blank" rel="noopener noreferrer">{t.continue}</a>:<button className="button" disabled>{t.continue}</button>}
    </>:<p role="status">{t.empty}</p>}
    <nav className="service-period-nav" aria-label={t.title}>{previous&&previous>=new Date().toISOString().slice(0,10)&&<Link href={`${path}?from=${previous}`}>{t.previous}</Link>}{next&&<Link href={`${path}?from=${next}`}>{t.next}</Link>}</nav>
  </section>;
}
