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
 if(v.valueMissing)return field instanceof HTMLSelectElement || field instanceof HTMLInputElement && field.type==='radio'?t.selection:t.required;
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
  type Previous={invalid:string|null;marked:string|null};
  type ErrorEntry={node:HTMLSpanElement;fields:Map<Field,Previous>};
  const errors=new Map<Field,ErrorEntry>();
  let serial=0,first:Field|null=null,focusTask:ReturnType<typeof setTimeout>|null=null,disposed=false;
  const isField=(target:EventTarget|null):target is Field=>target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
  const invalidField=(field:Field)=>field.isConnected && field.willValidate && !field.validity.valid;
  const group=(field:Field):Field[]=>{
   if(!(field instanceof HTMLInputElement) || field.type!=='radio' || !field.name)return [field];
   const root=field.getRootNode();
   if(!(root instanceof Document || root instanceof ShadowRoot))return [field];
   // Form ownership, tree and name define a native group; a fieldset alone does not.
   return Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(radio=>radio.form===field.form && radio.name===field.name);
  };
  const clear=(entry:ErrorEntry)=>{
   for(const [field,previous] of entry.fields){
    const described=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id && id!==entry.node.id);
    if(described.length)field.setAttribute('aria-describedby',described.join(' '));else field.removeAttribute('aria-describedby');
    if(previous.invalid===null)field.removeAttribute('aria-invalid');else field.setAttribute('aria-invalid',previous.invalid);
    if(previous.marked===null)field.removeAttribute('data-shida-invalid');else field.setAttribute('data-shida-invalid',previous.marked);
    errors.delete(field);
   }
   entry.node.remove();
  };
  const sameFields=(entry:ErrorEntry,fields:Field[])=>entry.fields.size===fields.length && fields.every(field=>entry.fields.has(field));
  const show=(field:Field)=>{
   const members=group(field),fields=members.filter(invalidField);
   if(!fields.length)return;
   let entry=errors.get(field);
   if(entry && !sameFields(entry,fields)){clear(entry);entry=undefined;}
   if(!entry){
    for(const member of fields){const old=errors.get(member);if(old)clear(old);}
    const node=document.createElement('span');
    do{node.id=`shida-constraint-error-${++serial}`;}while(document.getElementById(node.id));
    node.className='shida-field-error';node.setAttribute('role','alert');
    entry={node,fields:new Map()};
    const firstField=fields[0],fieldset=firstField instanceof HTMLInputElement && firstField.type==='radio'?firstField.closest('fieldset'):null;
    const ownsGroup=fieldset && members.every(member=>fieldset.contains(member)) && Array.from(fieldset.querySelectorAll('input,select,textarea')).every(control=>members.includes(control as Field));
    const anchor=ownsGroup?fieldset:fields[fields.length-1].closest('label') || fields[fields.length-1];
    anchor.insertAdjacentElement('afterend',node);
    for(const member of fields){
     entry.fields.set(member,{invalid:member.getAttribute('aria-invalid'),marked:member.getAttribute('data-shida-invalid')});errors.set(member,entry);
     member.setAttribute('aria-describedby',[member.getAttribute('aria-describedby'),node.id].filter(Boolean).join(' '));
    }
   }
   for(const member of fields){member.setAttribute('aria-invalid','true');member.setAttribute('data-shida-invalid','true');}
   const message=fieldMessage(fields[0]);if(entry.node.textContent!==message)entry.node.textContent=message;
  };
  const schedule=()=>{
   // Native invalid callbacks can have microtask checkpoints between them. Keep
   // the first control until the task finishes. Reconcile after application event
   // handlers have also updated controlled values, including validation proxies.
   if(focusTask===null)focusTask=setTimeout(()=>{
    const field=first;first=null;focusTask=null;
    if(disposed)return;
    reconcile();
    if(!field || !invalidField(field))return;
    const selector=field.getAttribute('data-validation-focus');
    const target=selector?field.closest('fieldset')?.querySelector<HTMLElement>(selector):null;
    if(target?.isConnected && !target.matches(':disabled'))target.focus();else field.focus();
   },0);
  };
  const invalid=(event:Event)=>{
   if(!isField(event.target))return;
   event.preventDefault();show(event.target);
   if(!first || first.form!==event.target.form)first=group(event.target).find(invalidField) || event.target;
   schedule();
  };
  const update=(event:Event)=>{
   if(!isField(event.target))return;
   for(const member of group(event.target)){const entry=errors.get(member);if(entry){if(member.validity.valid)clear(entry);else show(member);}}
   schedule();
  };
  const reset=(event:Event)=>{
   if(first?.form===event.target){if(focusTask!==null)clearTimeout(focusTask);focusTask=null;first=null;}
   for(const entry of new Set(errors.values()))if(Array.from(entry.fields.keys()).some(field=>field.form===event.target))clear(entry);
  };
  const reconcile=(languageChanged=false)=>{
   for(const entry of new Set(errors.values())){
    const field=Array.from(entry.fields.keys()).find(invalidField);
    if(!field){clear(entry);continue;}
    if(languageChanged || !sameFields(entry,group(field).filter(invalidField)))show(field);
   }
  };
  const observer=new MutationObserver(records=>reconcile(records.some(record=>record.attributeName==='lang')));
  // Refresh translations and release detached controls without rewriting on child mutations.
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang','disabled','required','name','form','type'],childList:true,subtree:true});
  document.addEventListener('invalid',invalid,true);document.addEventListener('input',update,true);document.addEventListener('change',update,true);document.addEventListener('reset',reset,true);
  return()=>{disposed=true;if(focusTask!==null)clearTimeout(focusTask);first=null;observer.disconnect();document.removeEventListener('invalid',invalid,true);document.removeEventListener('input',update,true);document.removeEventListener('change',update,true);document.removeEventListener('reset',reset,true);for(const entry of new Set(errors.values()))clear(entry);};
 },[]);
 return null;
}
