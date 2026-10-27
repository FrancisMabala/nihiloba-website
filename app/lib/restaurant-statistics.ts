// Local calendar boundaries; the Backend resolves DST and authorizes the range.
export function periodDates(days:1|7|30,timezone:string,now=new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=(key:string)=>parts.find(p=>p.type===key)!.value;
 const day=new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);
 const iso=(d:Date)=>d.toISOString().slice(0,10);
 const end=new Date(day);end.setUTCDate(end.getUTCDate()+1);
 day.setUTCDate(day.getUTCDate()-days+1);
 return {from:iso(day),to:iso(end)};
}

// Convert inclusive dates shown to owners to/from the API exclusive end boundary.
export function shiftCalendarDate(value:string,days:number) {
 if(!value)return value;
 const date=new Date(value+'T12:00:00Z');
 date.setUTCDate(date.getUTCDate()+days);
 return date.toISOString().slice(0,10);
}
