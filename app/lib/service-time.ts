/** Services appointments use Africa/Kinshasa (UTC+01:00, no clock change).
 * Financial effective dates remain calendar dates; never timezone-shift them.
 */
export const SERVICE_TIME_ZONE="Africa/Kinshasa";
const HOUR=3_600_000,DAY=24*HOUR;
// Historical Services timestamps may omit the suffix but are stored as UTC.
const instant=(value:string)=>Date.parse(/T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)?value+"Z":value);
export function validDay(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(`${value}T00:00:00Z`);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function shiftDay(value:string,days:number):string{
 if(!validDay(value)||!Number.isInteger(days))throw new Error("invalid_date");
 return new Date(Date.parse(`${value}T00:00:00Z`)+days*DAY).toISOString().slice(0,10);
}
export function inclusiveDateRange(start:string,end:string){
 if(!validDay(start)||!validDay(end)||start>end)throw new Error("invalid_date_range");
 return {start_date:start,end_date:shiftDay(end,1)};
}
export function serviceLocalInput(value:string):string{
 if(!value)return "";
 const time=instant(value);
 return Number.isFinite(time)?new Date(time+HOUR).toISOString().slice(0,16):"";
}
export function serviceUtcInput(value:string):string{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)||!validDay(value.slice(0,10))||value.slice(11,13)>"23"||value.slice(14)>"59")throw new Error("invalid_local_time");
 return new Date(Date.parse(`${value}:00+01:00`)).toISOString();
}
export function serviceTimestamp(value:string,locale:string):string{
 if(!value||!Number.isFinite(instant(value)))return "";
 return new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short",timeZone:SERVICE_TIME_ZONE}).format(new Date(instant(value)))+" · Kinshasa";
}
export function serviceAmount(value:string):string{
 const text=value.trim();
 if(!/^\d+(?:[.,]\d{1,2})?$/.test(text))throw new Error("invalid_amount");
 return text.replace(",",".");
}
/** Legacy booking proposals accept a single UTC calendar date. Keep that
 * boundary instead of quietly changing their persisted scheduling rules.
 */
export function serviceProposalInput(date:string,start:string,end:string,bookingZone:string){
 const first=serviceUtcInput(`${date}T${start}`),last=end?serviceUtcInput(`${date}T${end}`):null;
 if(bookingZone===SERVICE_TIME_ZONE)return {proposed_date:date,proposed_start_time:start,proposed_end_time:end||null,proposed_timezone:SERVICE_TIME_ZONE};
 if(last&&first.slice(0,10)!==last.slice(0,10))throw new Error("unsupported_overnight_interval");
 return {proposed_date:first.slice(0,10),proposed_start_time:first.slice(11,16),proposed_end_time:last?.slice(11,16)??null};
}
