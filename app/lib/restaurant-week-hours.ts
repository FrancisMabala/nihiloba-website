export type WeekWindow={weekday:number;start:string;end:string};
const minute=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3,5));
export function hoursOverlap(windows:WeekWindow[]){
 const spans=windows.filter(w=>/^\d{2}:\d{2}$/.test(w.start)&&/^\d{2}:\d{2}$/.test(w.end)).map(w=>{const start=w.weekday*1440+minute(w.start);return [start,w.weekday*1440+minute(w.end)+(w.end<=w.start?1440:0)];});
 return spans.some(([start,end],i)=>spans.some(([other,last],j)=>i!==j&&[-10080,0,10080].some(shift=>start<last+shift&&end>other+shift)));
}
export function copyHours(windows:WeekWindow[],source:number,targets:number[]){
 const days=targets.filter(day=>day!==source);return [...windows.filter(w=>!days.includes(w.weekday)),...days.flatMap(weekday=>windows.filter(w=>w.weekday===source).map(w=>({...w,weekday})))];
}
