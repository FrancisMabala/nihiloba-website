export const categories=['childcare','cleaning','laundry','kitchen','service','bar'];
export const candidateMissions=[...categories,'wewa'];
export const workCities=['Kinshasa','Lubumbashi','Goma','Kisangani','Bukavu','Matadi','Mbuji-Mayi','Kananga'];
export const weekdays=['mon','tue','wed','thu','fri','sat','sun'];
export const slots=['morning','afternoon','evening','flexible'];
export const suggestions:Record<string,string[]>={childcare:['homework','snack','games'],cleaning:['floor','iron'],laundry:['wash','iron'],kitchen:['prep'],service:['tables'],bar:['drinks','setup']};
export type Mission={category:string;name:string;example?:string;tasks:string[];experience:string;rate:string;amount:string;currency:string;unit:string};
export type Answers={missions:Mission[];city:string;communes:string[];districts:Record<string,string>;days:string[];slots:string[];frequency:string[];example:string;discovery:boolean};
export const newMission=(category:string,name=''):Mission=>({category,name,tasks:[],experience:'',rate:'',amount:'',currency:'',unit:''});
export const toggle=(a:string[],v:string)=>a.includes(v)?a.filter(n=>n!==v):[...a,v];
export const validText=(s:string)=>/\p{L}/u.test(s.trim())&&!/^(.)\1{2,}$/iu.test(s.trim());
export const normalized=(s:string)=>s.trim().normalize('NFKC').toLowerCase().replaceAll('’',"'");
export function initial(v:Record<string,string>,communes:string[]):Answers {
 if(v.occasional_answers)return JSON.parse(v.occasional_answers) as Answers;
 return {missions:(v.work_types||'').split(', ').filter(Boolean).filter(s=>!['CDI','CDD','Temps plein','Temps partiel','Occasionnel'].includes(s)).slice(0,3).map(s=>newMission('custom',s)),city:v.city||'',communes:(v.preferred_areas||'').split(', ').filter(s=>communes.includes(s)),districts:{},days:[],slots:[],frequency:[],example:v.description||'',discovery:false};
}
export function problem(a:Answers,step:number,title:(m:Mission)=>string){
 if(step===0){
 if(!a.missions.length||new Set(a.missions.map(m=>normalized(title(m)))).size!==a.missions.length||a.missions.some(m=>!validText(title(m))))return 'missions';
 if(!validText(a.city))return 'city';
 if(normalized(a.city)==='kinshasa'&&!a.communes.length)return 'communes';
 for(const [c,d] of Object.entries(a.districts))if(d.trim()&&!validText(d))return 'district-'+c;
 if(!a.slots.length||!a.days.length&&!a.slots.includes('flexible'))return 'schedule';
 }else{
 for(const [i,m] of a.missions.entries()){
 if(!m.tasks.length||m.tasks.some(v=>!validText(v)))return 'tasks-'+i;
 if(m.example?.trim()&&!validText(m.example))return 'example-'+i;
 if(!m.experience)return 'experience-'+i;
 if(m.rate==='amount'&&(!/^\d{1,12}([.,]\d{1,2})?$/.test(m.amount)||Number(m.amount.replace(',','.'))<=0||!m.unit||!m.currency))return 'rate-'+i;
 }
 if(a.example.trim()&&!validText(a.example))return 'example';
 }return '';
}