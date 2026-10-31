export type WorkingInterval={day:string;start:string;end:string};
export const workingDays=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
export function validWorkingHours(rows:WorkingInterval[]){
 const sorted=[...rows].sort((a,b)=>a.day.localeCompare(b.day)||a.start.localeCompare(b.start));
 return sorted.length<=21&&sorted.every((row,i)=>workingDays.includes(row.day)&&[row.start,row.end].every(time=>/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(time))&&row.start<row.end&&(!i||sorted[i-1].day!==row.day||sorted[i-1].end<=row.start));
}
export function copyWorkingHours(rows:WorkingInterval[],source:string,targets:string[]){
 const chosen=new Set(targets.filter(day=>workingDays.includes(day)&&day!==source));
 return [...rows.filter(row=>!chosen.has(row.day)),...Array.from(chosen).flatMap(day=>rows.filter(row=>row.day===source).map(row=>({...row,day})))];
}
