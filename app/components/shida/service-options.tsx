import type { Locale } from "../../lib/i18n";
import type { ServiceOffering } from "../../types/shida-public";
import { formatServiceDuration } from "./service-format";

const copy={en:{title:"1. Choose an option",selected:"Selected",choose:"Choose"},fr:{title:"1. Choisissez une option",selected:"Sélectionnée",choose:"Choisir"}} as const;

function price(option:ServiceOffering):string|null {if(!option.price)return null;return /[A-Za-z]{3}|[$€£]|CDF/i.test(option.price)?option.price:`${option.price}${option.currency?` ${option.currency}`:""}`;}

export function ServiceOptionSelector({locale,options,selected,path}:{locale:Locale;options:ServiceOffering[];selected:ServiceOffering|null;path:string}){
  const t=copy[locale];
  if(!options.length)return null;
  return <section className="service-option-selector" aria-labelledby="service-options-title"><h2 id="service-options-title">{t.title}</h2><div className="service-option-grid" role="group" aria-label={t.title}>{options.map((option)=>{const active=selected?.public_ref===option.public_ref;return <form action={path} method="get" key={option.public_ref}><button type="submit" name="option" value={option.public_ref} aria-pressed={active} className={active?"service-option is-selected":"service-option"}><span className="service-option-check" aria-hidden="true">{active?"✓":"○"}</span><span><strong>{option.name}</strong>{price(option)&&<small>{price(option)}</small>}{option.duration_minutes!=null&&<small>{formatServiceDuration(option.duration_minutes)}</small>}{option.description&&<small>{option.description}</small>}</span><span className="sr-only">{active?t.selected:t.choose}</span></button></form>;})}</div></section>;
}
