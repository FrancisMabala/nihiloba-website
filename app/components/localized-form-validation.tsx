'use client';

import {useEffect} from 'react';
import './localized-form-validation.css';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const messages = {
 en: {required:'This field is required.',selection:'Please select an option.',email:'Enter a valid email address.',url:'Enter a valid web address.',number:'Enter a valid number.',format:'Check the format of this field.',min:'Enter a value greater than or equal to',max:'Enter a value less than or equal to',invalid:'Please correct this field.'},
 fr: {required:'Ce champ est obligatoire.',selection:'Veuillez sélectionner une option.',email:'Veuillez saisir une adresse e-mail valide.',url:'Veuillez saisir une adresse web valide.',number:'Veuillez saisir un nombre valide.',format:'Veuillez vérifier le format de ce champ.',min:'Veuillez saisir une valeur supérieure ou égale à',max:'Veuillez saisir une valeur inférieure ou égale à',invalid:'Veuillez corriger ce champ.'},
 ln: {required:'Esika oyo esengeli kotondisama.',selection:'Poná likambo moko.',email:'Komá adrɛsi e-mail ya malamu.',url:'Komá adrɛsi ya site ya malamu.',number:'Komá motángo ya malamu.',format:'Talá ndenge okomi na esika oyo.',min:'Komá motángo oyo eleki to ekokani na',max:'Komá motángo oyo ezali na nse to ekokani na',invalid:'Bongisá esika oyo.'},
 sw: {required:'Sehemu hii ni ya lazima.',selection:'Tafadhali chagua chaguo.',email:'Weka anwani halali ya barua pepe.',url:'Weka anwani halali ya tovuti.',number:'Weka nambari halali.',format:'Angalia muundo wa sehemu hii.',min:'Weka thamani kubwa kuliko au sawa na',max:'Weka thamani ndogo kuliko au sawa na',invalid:'Tafadhali sahihisha sehemu hii.'},
};

function fieldMessage(field:Field){
 const language=field.closest('[lang]')?.getAttribute('lang')?.toLowerCase().split('-')[0] || 'en';
 const t=messages[language as keyof typeof messages] || messages.en,v=field.validity;
 if(v.valueMissing)return field instanceof HTMLSelectElement?t.selection:t.required;
 if(v.typeMismatch)return field instanceof HTMLInputElement && field.type==='email'?t.email:t.url;
 if(v.badInput || v.stepMismatch)return t.number;
 if(v.rangeUnderflow)return `${t.min} ${field.getAttribute('min')}.`;
 if(v.rangeOverflow)return `${t.max} ${field.getAttribute('max')}.`;
 if(v.patternMismatch || v.tooShort || v.tooLong)return t.format;
 // Never display browser-language validationMessage or an untrusted server message.
 return t.invalid;
}

/** Presents native constraints inline; does not disable constraints or change submission. */
export function LocalizedFormValidation(){
 useEffect(()=>{
  const errors=new Map<Field,{node:HTMLSpanElement;previousInvalid:string|null}>();
  let serial=0,first:Field|null=null,disposed=false;
  const isField=(target:EventTarget|null):target is Field=>target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
  const clear=(field:Field)=>{
   const entry=errors.get(field);if(!entry)return;
   const described=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id && id!==entry.node.id);
   if(described.length)field.setAttribute('aria-describedby',described.join(' '));else field.removeAttribute('aria-describedby');
   if(entry.previousInvalid===null)field.removeAttribute('aria-invalid');else field.setAttribute('aria-invalid',entry.previousInvalid);
   field.removeAttribute('data-shida-invalid');entry.node.remove();errors.delete(field);
  };
  const show=(field:Field)=>{
   let entry=errors.get(field);
   if(!entry){
    const node=document.createElement('span');node.id=`shida-constraint-error-${++serial}`;node.className='shida-field-error';node.setAttribute('role','alert');
    entry={node,previousInvalid:field.getAttribute('aria-invalid')};errors.set(field,entry);
    (field.closest('label') || field).insertAdjacentElement('afterend',node);
    field.setAttribute('aria-describedby',[field.getAttribute('aria-describedby'),node.id].filter(Boolean).join(' '));
   }
   entry.node.textContent=fieldMessage(field);field.setAttribute('aria-invalid','true');field.setAttribute('data-shida-invalid','true');
  };
  const invalid=(event:Event)=>{
   if(!isField(event.target))return;
   event.preventDefault();show(event.target);
   if(!first){first=event.target;queueMicrotask(()=>{if(!disposed && first?.isConnected){const selector=first.getAttribute('data-validation-focus');const target=selector?first.closest('fieldset')?.querySelector<HTMLElement>(selector):null;(target || first).focus();}first=null;});}
  };
  const update=(event:Event)=>{
   if(isField(event.target) && errors.has(event.target)){if(event.target.validity.valid)clear(event.target);else show(event.target);}
  };
  const reset=(event:Event)=>{for(const field of errors.keys())if(field.form===event.target)clear(field);};
  const observer=new MutationObserver(records=>{const languageChanged=records.some(record=>record.type==='attributes');for(const field of errors.keys()){if(!field.isConnected || field.disabled || field.validity.valid)clear(field);else if(languageChanged)show(field);}});
  // Refresh translations and release detached controls without rewriting on child mutations.
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang'],childList:true,subtree:true});
  document.addEventListener('invalid',invalid,true);document.addEventListener('input',update,true);document.addEventListener('change',update,true);document.addEventListener('reset',reset,true);
  return()=>{disposed=true;observer.disconnect();document.removeEventListener('invalid',invalid,true);document.removeEventListener('input',update,true);document.removeEventListener('change',update,true);document.removeEventListener('reset',reset,true);for(const field of errors.keys())clear(field);};
 },[]);
 return null;
}
