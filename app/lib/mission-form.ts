import {validText} from './occasional-form';
export type MissionValues=Record<string,string|null|undefined>;
export const blankTerms={category:'',custom:'',frequency:'',day:'',date_flexible:false,weekdays:[] as string[],schedule_note:'',start_date:'',hours:'',start:'',end:'',overnight:false,rate:'',amount:'',currency:'',unit:'',experience:''};
export type Terms=typeof blankTerms;
export function missionTerms(v:MissionValues):Terms{return v.mission_terms?JSON.parse(v.mission_terms):{...blankTerms,experience:v.optional_experience||'',start_date:v.start_date||''}}
export function missionProblem(v:MissionValues,m:Terms,step:number,communes:string[]){
 if(step===0){
 if(!m.category)return 'category';if(m.category==='custom'&&!validText(m.custom))return 'custom';
 for(const k of ['job','short_summary','work_city'])if(!validText(v[k]||''))return k;
 if(v.work_city?.trim().toLowerCase()==='kinshasa'&&!communes.includes(v.commune??''))return 'commune';
 for(const k of ['commune','quartier'])if(v[k]?.trim()&&!validText(v[k]!))return k;
 }else{
 if(!m.frequency)return 'frequency';if(m.frequency==='once'&&!m.date_flexible&&!m.day)return 'day';
 if(m.frequency==='regular'&&!m.weekdays.length&&!validText(m.schedule_note))return 'weekdays';
 if(!m.hours)return 'hours';if(m.hours==='fixed'&&(!m.start||!m.end))return !m.start?'start':'end';
 if(m.hours==='fixed'&&(m.overnight?m.end>=m.start:m.end<=m.start))return 'end';
 if(m.rate==='amount'&&(!/^\d{1,12}([.,]\d{1,2})?$/.test(m.amount)||Number(m.amount.replace(',','.'))<=0||!m.unit||!m.currency))return 'amount';
 }return '';
}
export const payload=(v:MissionValues)=>Object.fromEntries(['job','work_city','commune','quartier','short_summary','mission_terms'].map(k=>[k,k==='mission_terms'?JSON.stringify(missionTerms(v)):v[k]||'']));
