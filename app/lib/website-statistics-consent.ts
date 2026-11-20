export const STATISTICS_POLICY='web-statistics-v1';
export const STATISTICS_CHOICE_KEY='shida_statistics_consent_v1';
export const STATISTICS_VISITOR_KEY='shida_statistics_visitor_v1';
export const STATISTICS_SESSION_KEY='shida_statistics_session_v1';
const employerPrefix='shida_employer_visit_';
const day=86400000,sessionIdle=30*60000,visitorLifetime=30*day,choiceLifetime=180*day;
const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export type StatisticsConsent='unknown'|'accepted'|'declined'|'blocked';
export type StatisticsDimensions={page_group:string;device:string;browser:string;language:string;source:string};
export type StatisticsPayload=StatisticsDimensions&{consent:true;policy:typeof STATISTICS_POLICY;visitor:string;session:string;visit:string;active_seconds:number};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
type Identity={id:string;expires:number};
type Choice={choice:'accepted'|'declined';expires:number};
export type StatisticsEnvironment={now:()=>number;uuid:()=>string;blocked:()=>boolean;local:()=>Store|null;session:()=>Store|null;send:(body:StatisticsPayload,signal:AbortSignal)=>Promise<unknown>;sendEmployer:(reference:string,ids:{event:string;visitor:string},signal:AbortSignal)=>Promise<unknown>};

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
 private choice:Choice|null=null;private visitor:Identity|null=null;private session:Identity|null=null;
 private listeners=new Set<()=>void>();private pending=new Set<AbortController>();private employers=new Map<string,{session:string;id:string}>();
 private generation=0;private state:StatisticsConsent='unknown';
 constructor(private env:StatisticsEnvironment){}
 private read<T>(storage:Store|null,key:string,fallback:T|null):T|null{try{const value=storage?.getItem(key);return storage?(value?JSON.parse(value):null):fallback;}catch{return fallback;}}
 private write(storage:Store|null,key:string,value:unknown){try{storage?.setItem(key,JSON.stringify(value));}catch{/* Memory-only consent and IDs remain usable. */}}
 consent=():StatisticsConsent=>{
  if(this.env.blocked())return 'blocked';
  const value=this.read<Choice>(this.env.local(),STATISTICS_CHOICE_KEY,this.choice);
  return value&&['accepted','declined'].includes(value.choice)&&Number.isFinite(value.expires)&&value.expires>this.env.now()&&value.expires<=this.env.now()+choiceLifetime?value.choice:'unknown';
 };
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private clear(){
  for(const controller of this.pending)controller.abort();this.pending.clear();this.visitor=null;this.session=null;this.employers.clear();this.generation++;
  try{this.env.local()?.removeItem(STATISTICS_VISITOR_KEY);}catch{}
  try{const store=this.env.session();store?.removeItem(STATISTICS_SESSION_KEY);if(store)for(let i=store.length-1;i>=0;i--){const key=store.key(i);if(key?.startsWith(employerPrefix))store.removeItem(key);}}catch{}
 }
 refresh=()=>{const value=this.consent();if(value!=='accepted')this.clear();this.state=value;for(const listener of this.listeners)listener();};
 choose=(choice:'accepted'|'declined')=>{
  if(choice==='accepted'&&this.env.blocked()){this.refresh();return;}
  this.choice={choice,expires:this.env.now()+choiceLifetime};this.write(this.env.local(),STATISTICS_CHOICE_KEY,this.choice);this.refresh();
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
  sendEmployer:(reference,ids,signal)=>fetch('/api/shida/employer-pages/'+encodeURIComponent(reference)+'/view/',{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{'X-Shida-Event':ids.event,'X-Shida-Visitor':ids.visitor},signal}),
 });
 return browserStatistics;
}
export const statisticsConsentSnapshot=()=>websiteStatistics()?.consent()??'unknown';
export const statisticsServerSnapshot=():StatisticsConsent=>'unknown';
export function subscribeStatisticsConsent(listener:()=>void){
 const stats=websiteStatistics();if(!stats)return()=>{};const unsubscribe=stats.subscribe(listener);
 const refresh=()=>stats.refresh();window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);stats.refresh();
 return()=>{unsubscribe();window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
}

export const statisticsCopy={
 en:{privacy:'Privacy policy',title:'Optional website statistics',description:'May SHIDA measure visits, device and browser types, and active time to improve this website? This also enables optional employer and Restaurant-interest counts. Signed-in Restaurant events keep an internal account reference; restaurants see protected totals. No advertising tracking or precise location. You can change your choice here at any time.',accept:'Accept statistics',decline:'Decline statistics',settings:'Statistics preferences',on:'Optional statistics are enabled.',off:'Optional statistics are off. You can use the website normally.',blocked:'Your browser privacy preference disables optional statistics.',close:'Close preferences'},
 fr:{privacy:'Politique de confidentialité',title:'Statistiques facultatives du site',description:'SHIDA peut-il mesurer les visites, les types d’appareil et de navigateur et le temps actif pour améliorer ce site ? Ce choix active aussi les mesures facultatives des pages employeurs et de l’intérêt pour les Restaurants. Les interactions Restaurant connectées gardent une référence interne au compte ; les restaurants voient des totaux protégés. Aucun suivi publicitaire ni localisation précise. Vous pouvez modifier votre choix ici à tout moment.',accept:'Accepter les statistiques',decline:'Refuser les statistiques',settings:'Préférences de statistiques',on:'Les statistiques facultatives sont activées.',off:'Les statistiques facultatives sont désactivées. Vous pouvez utiliser le site normalement.',blocked:'Le choix de confidentialité de votre navigateur désactive les statistiques facultatives.',close:'Fermer les préférences'},
 ln:{privacy:'Politiki ya sekele (Français)',title:'Mitango ya site, soki olingi',description:'SHIDA ekoki kotanga botali, mitindo ya aparɛyi mpe navigateur, mpe ntango ya kosalela site mpo na kobongisa yango ? Boponi oyo efungolaka mpe mitango ya nkasa ya bapesi-mosala mpe bosepeli na ba restaurant. Misala ya restaurant ya bato bakɔti ebatelaka elembo ya konti na kati ; ba restaurant bamonaka kaka mitango esangani ebatelami. Kolanda mpo na piblisite te, esika ya sikisiki te. Okoki kobongola boponi na yo awa ntango nyonso.',accept:'Ndima mitango',decline:'Boya mitango',settings:'Boponi ya mitango',on:'Mitango ya site efungwami.',off:'Mitango ya site ekangami. Okoki kosalela site ndenge ya momeseno.',blocked:'Boponi ya sekele ya navigateur na yo ekangi mitango ya site.',close:'Kanga boponi'},
 sw:{privacy:'Sera ya faragha (Kifaransa)',title:'Takwimu za tovuti za hiari',description:'Je, SHIDA inaweza kupima ziara, aina za kifaa na kivinjari, na muda wa matumizi ili kuboresha tovuti? Chaguo hili pia huwasha takwimu za hiari za waajiri na mvuto kwa migahawa. Matukio ya mgahawa ya walioingia huhifadhi rejea ya akaunti ndani; migahawa huona jumla zilizolindwa. Hakuna ufuatiliaji wa matangazo wala eneo sahihi. Unaweza kubadilisha chaguo lako hapa wakati wowote.',accept:'Kubali takwimu',decline:'Kataa takwimu',settings:'Mapendeleo ya takwimu',on:'Takwimu za hiari zimewashwa.',off:'Takwimu za hiari zimezimwa. Unaweza kutumia tovuti kama kawaida.',blocked:'Chaguo la faragha la kivinjari chako limezima takwimu za hiari.',close:'Funga mapendeleo'},
};
