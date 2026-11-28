export const STATISTICS_POLICY='web-statistics-v1';
// Browser choice disclosure version is independent from the stable API wire policy.
export const STATISTICS_CHOICE_POLICY='cookie-preferences-v2';
export const STATISTICS_CHOICE_KEY='shida_statistics_consent_v1';
export const STATISTICS_VISITOR_KEY='shida_statistics_visitor_v1';
export const STATISTICS_SESSION_KEY='shida_statistics_session_v1';
const employerPrefix='shida_employer_visit_';
const jobViewPrefix='shida_job_viewed_';
type JobEvent='view'|'share';
const day=86400000,sessionIdle=30*60000,visitorLifetime=30*day,choiceLifetime=180*day;
const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export type StatisticsConsent='unknown'|'accepted'|'declined'|'blocked';
export type StatisticsDimensions={page_group:string;device:string;browser:string;language:string;source:string};
export type StatisticsPayload=StatisticsDimensions&{consent:true;policy:typeof STATISTICS_POLICY;visitor:string;session:string;visit:string;active_seconds:number};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
type Identity={id:string;expires:number};
type Choice={choice:'accepted'|'declined';expires:number;policy?:string;grant?:string};
export type StatisticsEnvironment={now:()=>number;uuid:()=>string;blocked:()=>boolean;local:()=>Store|null;session:()=>Store|null;send:(body:StatisticsPayload,signal:AbortSignal)=>Promise<unknown>;sendEmployer:(reference:string,ids:{event:string;visitor:string},signal:AbortSignal)=>Promise<unknown>;sendJob?:(reference:string,event:JobEvent,signal:AbortSignal)=>Promise<unknown>};

export function statisticsDimensions(pathname:string,language:string,userAgent:string,referrer:string,origin:string):StatisticsDimensions{
 const parts=pathname.split('/').filter(Boolean);if(['en','fr','ln','sw'].includes(parts[0]))parts.shift();
 const section=parts[0]==='shida'?parts[1]:parts[0];let page_group='other';
 if(!parts.length)page_group='nihiloba';else if(parts[0]==='shida'&&!section)page_group='shida';
 else if(['emplois','jobs'].includes(section))page_group=parts.includes('employeurs')?'employer':'employment';
 else for(const [group,keys] of Object.entries({wenze:['wenze'],restaurants:['restaurants','restaurant'],services:['services'],apartments:['appartements','apartments'],hotels:['hotels','hotels-sejours'],transport:['wewa','transport','mobility'],meda:['meda'],account:['space','login','register','account'],help:['contact','faq','help','support']}))if(keys.includes(section)){page_group=group;break;}
 const ua=userAgent.toLowerCase();
 const browser=/edg[eaios]*\//.test(ua)?'edge':/opr\/|opera/.test(ua)?'opera':/firefox|fxios/.test(ua)?'firefox':/chrome|crios/.test(ua)?'chrome':/safari/.test(ua)?'safari':'other';
 const device=/ipad|tablet/.test(ua)||/android/.test(ua)&&!/mobile/.test(ua)?'tablet':/mobile|iphone|ipod/.test(ua)?'phone':/windows|macintosh|linux|cros/.test(ua)?'desktop':'other';
 let source='direct';if(referrer)try{const url=new URL(referrer);source=url.origin===origin?'internal':/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+)$/.test(url.hostname)?'search':/(^|\.)(facebook\.com|instagram\.com|linkedin\.com|t\.co|x\.com|whatsapp\.com|tiktok\.com)$/.test(url.hostname)?'social':'other';}catch{source='other';}
 return {page_group,device,browser,language:['fr','en','ln','sw'].includes(language)?language:'other',source};
}

/** One purpose-specific controller. Constructing it performs no storage write or measurement. */
export class WebsiteStatistics{
 private unsavedChoice:Choice|null=null;private visitor:Identity|null=null;private session:Identity|null=null;
 private listeners=new Set<()=>void>();private pending=new Set<AbortController>();private employers=new Map<string,{session:string;id:string}>();
 private generation=0;private state:StatisticsConsent='unknown';
 constructor(private env:StatisticsEnvironment){}
 private read<T>(storage:Store|null,key:string,fallback:T|null):T|null{try{const value=storage?.getItem(key);return storage?(value?JSON.parse(value):null):fallback;}catch{return fallback;}}
 private write(storage:Store|null,key:string,value:unknown){try{storage?.setItem(key,JSON.stringify(value));}catch{/* Memory-only consent and IDs remain usable. */}}
 private validChoice(value:Choice|null):value is Choice{
  const now=this.env.now();
  return !!value&&(value.choice==='declined'||(value.choice==='accepted'&&value.policy===STATISTICS_CHOICE_POLICY))
   &&Number.isFinite(value.expires)&&value.expires>now&&value.expires<=now+choiceLifetime;
 }
 consent=():StatisticsConsent=>{
  if(this.env.blocked())return 'blocked';
  if(this.unsavedChoice?.choice==='declined'&&this.validChoice(this.unsavedChoice))return 'declined';
  const tabChoice=this.read<Choice>(this.env.session(),STATISTICS_CHOICE_KEY,null);
  if(tabChoice?.choice==='declined'&&this.validChoice(tabChoice))return 'declined';
  const stored=this.read<Choice>(this.env.local(),STATISTICS_CHOICE_KEY,null);
  const value=stored??this.unsavedChoice;
  return this.validChoice(value)?value.choice:'unknown';
 };
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private clear(){
  for(const controller of this.pending)controller.abort();this.pending.clear();this.visitor=null;this.session=null;this.employers.clear();this.generation++;
  try{this.env.local()?.removeItem(STATISTICS_VISITOR_KEY);}catch{}
  try{const store=this.env.session();store?.removeItem(STATISTICS_SESSION_KEY);if(store)for(let i=store.length-1;i>=0;i--){const key=store.key(i);if(key&&(key.startsWith(employerPrefix)||key.startsWith(jobViewPrefix)))store.removeItem(key);}}catch{}
 }
 refresh=()=>{const value=this.consent();if(value!=='accepted')this.clear();this.state=value;for(const listener of this.listeners)listener();};
 choose=(choice:'accepted'|'declined')=>{
  if(choice==='accepted'&&this.env.blocked()){this.refresh();return;}
  const value={choice,expires:this.env.now()+choiceLifetime,policy:STATISTICS_CHOICE_POLICY,...(choice==='accepted'?{grant:this.env.uuid()}:{})};
  const storage=this.env.local();
  this.unsavedChoice=value;
  try{
   if(storage){
    storage.setItem(STATISTICS_CHOICE_KEY,JSON.stringify(value));
    this.unsavedChoice=null;
   }
  }catch{
   // Clear any earlier persisted acceptance so other tabs and reloads fail closed.
   try{storage?.removeItem(STATISTICS_CHOICE_KEY);}catch{/* The current document still honors the new choice. */}
  }
  if(choice==='declined'&&this.unsavedChoice){
   // If the local preference cannot be saved, preserve refusal through same-tab reloads.
   this.write(this.env.session(),STATISTICS_CHOICE_KEY,value);
  }else if(choice==='accepted'){
   const session=this.env.session();
   try{session?.removeItem(STATISTICS_CHOICE_KEY);}catch{
    // Some storage policies permit replacement even when deletion fails.
    this.write(session,STATISTICS_CHOICE_KEY,value);
   }
  }
  this.refresh();
 };
 private enabled(){if(this.consent()==='accepted'){this.state='accepted';return true;}if(this.state==='accepted'||this.pending.size)this.refresh();return false;}
 private identifiers(active:boolean){
  if(!this.enabled())return null;const now=this.env.now();
  const valid=(value:Identity|null,max:number)=>value&&uuidPattern.test(value.id)&&Number.isFinite(value.expires)&&value.expires>now&&value.expires<=now+max;
  let visitor=this.read<Identity>(this.env.local(),STATISTICS_VISITOR_KEY,this.visitor);
  if(!valid(visitor,visitorLifetime)){visitor={id:this.env.uuid(),expires:now+visitorLifetime};this.write(this.env.local(),STATISTICS_VISITOR_KEY,visitor);}this.visitor=visitor;
  let session=this.read<Identity>(this.env.session(),STATISTICS_SESSION_KEY,this.session);
  if(!valid(session,sessionIdle))session={id:this.env.uuid(),expires:now+sessionIdle};else if(active)session={...session!,expires:now+sessionIdle};
  this.session=session;this.write(this.env.session(),STATISTICS_SESSION_KEY,session);
  return {visitor:visitor!.id,session:session!.id};
 }
 private send(operation:(signal:AbortSignal)=>Promise<unknown>){
  if(!this.enabled())return;const controller=new AbortController();this.pending.add(controller);
  void Promise.resolve().then(()=>{if(!controller.signal.aborted&&this.enabled())return operation(controller.signal);}).catch(()=>{/* Statistics never interrupt browsing. */}).finally(()=>this.pending.delete(controller));
 }
 observe(dimensions:StatisticsDimensions){
  const epoch=this.generation;let ids:{visitor:string;session:string}|null=null,visit='',activeMs=0,lastAt=this.env.now(),lastInput=lastAt,lastSend=0,lastSentSeconds=-1,wasActive=false,closed=false;
  const permitted=()=>!closed&&epoch===this.generation&&this.enabled();
  const send=()=>{const seconds=Math.min(14400,Math.floor(activeMs/1000));if(ids&&visit&&seconds!==lastSentSeconds&&permitted()){const payload:StatisticsPayload={...dimensions,consent:true,policy:STATISTICS_POLICY,...ids,visit,active_seconds:seconds};lastSend=this.env.now();lastSentSeconds=seconds;this.send(signal=>this.env.send(payload,signal));}};
  const tick=(visible:boolean,focused:boolean,flush=false)=>{
   if(!permitted())return;const now=this.env.now();
   if(wasActive)activeMs+=Math.max(0,Math.min(now,lastInput+60000,lastAt+30000)-lastAt);
   lastAt=now;wasActive=visible&&focused&&now-lastInput<60000;
   if(wasActive){const current=this.identifiers(true);if(current&&(!ids||ids.visitor!==current.visitor||ids.session!==current.session)){ids=current;visit=this.env.uuid();activeMs=0;lastSentSeconds=-1;send();}}
   if(ids&&(flush||now-lastSend>=30000))send();
  };
  return {tick:(visible:boolean,focused:boolean)=>tick(visible,focused,!visible),activity:()=>{if(permitted())lastInput=this.env.now();},stop:(visible=false,focused=false)=>{tick(visible,focused,true);closed=true;}};
 }
 prepareJobShare(reference:string){
  if(!this.enabled())return;
  const epoch=this.generation,grant=this.grantSnapshot();
  return ()=>{
   if(epoch===this.generation&&grant===this.grantSnapshot())this.job(reference,'share',grant);
  };
 }
 private grantSnapshot(){return JSON.stringify(this.read<Choice>(this.env.local(),STATISTICS_CHOICE_KEY,this.unsavedChoice)??this.unsavedChoice);}
 job(reference:string,event:JobEvent,grant?:string){
  const sendJob=this.env.sendJob;
  if(!sendJob||!/^JOB_[A-Za-z0-9_-]{1,120}$/.test(reference))return;
  this.send(signal=>{
   // A suspended tab may receive refusal/reacceptance storage events only later.
   if(grant!==undefined&&grant!==this.grantSnapshot())return Promise.resolve();
   if(event==='view'){
    const key=jobViewPrefix+reference;
    try{
     const storage=this.env.session();
     if(storage?.getItem(key))return Promise.resolve();
     storage?.setItem(key,'1');
    }catch{/* Without storage, only session deduplication is unavailable. */}
   }
   return sendJob(reference,event,signal);
  });
 }
 employer(reference:string){
  if(!/^ORGDIR_[A-Za-z0-9_-]{1,64}$/.test(reference)||!this.enabled())return;
  const ids=this.identifiers(true);if(!ids)return;
  const key=employerPrefix+reference;let visitor=this.read<{session:string;id:string}>(this.env.session(),key,this.employers.get(reference)??null);
  if(!visitor||visitor.session!==ids.session||!uuidPattern.test(visitor.id)){visitor={session:ids.session,id:this.env.uuid()};this.write(this.env.session(),key,visitor);}this.employers.set(reference,visitor);
  const event=this.env.uuid(),value=visitor.id;this.send(signal=>this.env.sendEmployer(reference,{event,visitor:value},signal));
 }
}

let browserStatistics:WebsiteStatistics|undefined;
export function websiteStatistics():WebsiteStatistics|null{
 if(typeof window==='undefined')return null;
 if(!browserStatistics)browserStatistics=new WebsiteStatistics({now:()=>Date.now(),uuid:()=>crypto.randomUUID(),blocked:()=>navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl===true||!window.crypto?.randomUUID,
  local:()=>{try{return window.localStorage;}catch{return null;}},session:()=>{try{return window.sessionStorage;}catch{return null;}},
  send:(body,signal)=>fetch('/api/shida/statistics/',{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal}),
  // Origin-only preserves the public action gateway's same-origin POST check.
  sendJob:(reference,event,signal)=>fetch('/api/shida/public-jobs/'+encodeURIComponent(reference)+'/'+event,{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'origin',signal}),
  sendEmployer:(reference,ids,signal)=>fetch('/api/shida/employer-pages/'+encodeURIComponent(reference)+'/view/',{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{'X-Shida-Event':ids.event,'X-Shida-Visitor':ids.visitor},signal}),
 });
 return browserStatistics;
}
export const statisticsConsentSnapshot=()=>websiteStatistics()?.consent()??'unknown';
export const statisticsServerSnapshot=():StatisticsConsent=>'unknown';
export function subscribeStatisticsConsent(listener:()=>void){
 const stats=websiteStatistics();if(!stats)return()=>{};const unsubscribe=stats.subscribe(listener);
 const refresh=()=>stats.refresh();const storage=(event:StorageEvent)=>{if(event.key===null||event.key===STATISTICS_CHOICE_KEY)refresh();};window.addEventListener('storage',storage);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);stats.refresh();
 return()=>{unsubscribe();window.removeEventListener('storage',storage);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
}

export const statisticsCopy={
 en:{
  privacy:'Privacy policy',title:'Your privacy',description:'We use essential cookies to keep SHIDA working. With your permission, optional usage statistics help us improve the site.',
  preferences:'Cookie preferences',customize:'Customize my preferences',settings:'Manage my cookies',accept:'Accept all',decline:'Reject all',save:'Save my preferences',
  necessary:'Essential cookies',necessaryDetails:'Keep sign-in, security and your shopping cart working.',always:'Always active',analytics:'Optional analytics',
  details:'We measure visits, device and browser types, active time, employer page views, external job views and shares, and interest in restaurants. Signed-in Restaurant events keep an internal account reference. Restaurants see protected totals.',
  choiceHelp:'You can use SHIDA normally if you reject optional analytics.',
  blocked:'Your browser privacy preference disables optional analytics.',dismiss:'Dismiss cookie notice',close:'Close cookie preferences',
 },
 fr:{
  privacy:'Politique de confidentialité',title:'Votre confidentialité',description:'Nous utilisons des cookies nécessaires au fonctionnement de SHIDA. Avec votre accord, des statistiques facultatives nous aident à améliorer le site.',
  preferences:'Préférences de cookies',customize:'Personnaliser mes préférences',settings:'Gérer mes cookies',accept:'Tout accepter',decline:'Tout refuser',save:'Enregistrer mes préférences',
  necessary:'Cookies nécessaires',necessaryDetails:'Permettent la connexion, assurent la sécurité et conservent votre panier.',always:'Toujours actifs',analytics:'Mesure d’audience facultative',
  details:'Nous mesurons les visites, les types d’appareil et de navigateur, le temps d’utilisation active, les vues de pages employeurs, les vues et partages d’offres externes et l’intérêt pour les restaurants. Les interactions Restaurant en mode connecté conservent une référence interne au compte. Les restaurants voient des totaux protégés.',
  choiceHelp:'Vous pouvez utiliser SHIDA normalement si vous refusez les statistiques.',
  blocked:'Votre réglage de confidentialité dans le navigateur désactive la mesure d’audience facultative.',dismiss:'Fermer l’avis sur les cookies',close:'Fermer les préférences de cookies',
 },
 ln:{
  privacy:'Politiki ya sekele (Français)',title:'Sekele na yo',description:'Tosalelaka ba cookies oyo esengeli mpo SHIDA esala. Soki ondimi, tokosalela mitango ya ndenge bato basalelaka site mpo tóbongisa yango.',
  preferences:'Boponi ya ba cookies',customize:'Bongisa boponi na ngai',settings:'Bongisa ba cookies na ngai',accept:'Ndima nyonso',decline:'Boya nyonso',save:'Bomba boponi na ngai',
  necessary:'Ba cookies ya ntina',necessaryDetails:'Esalisaka mpo na kokɔta, kobatela sekele mpe kobomba biloko na panier.',always:'Esalaka ntango nyonso',analytics:'Mitango ya site soki olingi',
  details:'Totángaka botali, mitindo ya aparɛyi mpe ya navigateur, ntango ya kosalela site, botali ya nkasa ya bapesi-mosala, botali mpe bokaboli ya misala ya libándá, mpe bosepeli na ba restaurant. Misala ya restaurant ya bato oyo bakɔti ebatelaka elembo ya konti na kati. Ba restaurant bamonaka kaka mitango esangani ebatelami.',
  choiceHelp:'Ata oboyi mitango, okoki kosalela SHIDA ndenge ya momeseno.',
  blocked:'Boponi ya sekele ya navigateur na yo ekangi mitango ya site.',dismiss:'Kanga liyebisi ya ba cookies',close:'Kanga boponi ya ba cookies',
 },
 sw:{
  privacy:'Sera ya faragha (Kifaransa)',title:'Faragha yako',description:'Tunatumia vidakuzi muhimu ili SHIDA ifanye kazi. Kwa idhini yako, tunatumia takwimu za hiari kuboresha tovuti.',
  preferences:'Mapendeleo ya vidakuzi',customize:'Badilisha mapendeleo yangu',settings:'Dhibiti vidakuzi vyangu',accept:'Kubali vyote',decline:'Kataa vyote',save:'Hifadhi mapendeleo yangu',
  necessary:'Vidakuzi muhimu',necessaryDetails:'Vinawezesha kuingia, kudumisha usalama na kuhifadhi kikapu chako.',always:'Hufanya kazi daima',analytics:'Takwimu za hiari',
  details:'Tunapima ziara, aina za vifaa na vivinjari, muda wa matumizi, mitazamo ya kurasa za waajiri, mitazamo na ushiriki wa matangazo ya kazi ya nje, na mvuto kwa migahawa. Matukio ya mgahawa ya walioingia huhifadhi rejea ya akaunti ndani. Migahawa huona jumla zilizolindwa.',
  choiceHelp:'Unaweza kutumia SHIDA kama kawaida hata ukikataa takwimu za hiari.',
  blocked:'Chaguo la faragha la kivinjari chako limezima takwimu za hiari.',dismiss:'Funga taarifa ya vidakuzi',close:'Funga mapendeleo ya vidakuzi',
 },
};

export function statisticsLocale(language:string):keyof typeof statisticsCopy{
 return language==='fr'||language==='ln'||language==='sw'?language:'en';
}
