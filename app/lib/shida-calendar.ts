export type CalendarMarketplace = 'restaurants' | 'services' | 'apartments';
export type CalendarStatusTone = 'pending' | 'confirmed' | 'muted';

/** Presentation only. The module adapter owns authorization, capacity and actions. */
export type CalendarEvent = {
  marketplace: CalendarMarketplace;
  reference: string;
  startsAt: string;
  endsAt?: string;
  timeZone: string;
  title: string;
  status: string;
  tone: CalendarStatusTone;
  destination: {kind: 'detail'; reference: string};
};

export type CalendarLocale = 'fr' | 'en' | 'ln' | 'sw';
/** A marketplace can mount only after its protected, exact-scope range read exists. */
export type CalendarSource<Scope> = {
  marketplace: CalendarMarketplace;
  readRange: (scope:Scope, from:string, to:string, page:number)=>Promise<{events:CalendarEvent[];hasMore:boolean}>;
};
export type ProtectedCalendarProjection = Pick<CalendarEvent,'reference'|'startsAt'|'endsAt'|'timeZone'|'title'|'status'|'tone'>;
export function servicesEvent(row:ProtectedCalendarProjection):CalendarEvent {
  return {marketplace:'services',...row,destination:{kind:'detail',reference:row.reference}};
}
export function apartmentVisitEvent(row:ProtectedCalendarProjection):CalendarEvent {
  return {marketplace:'apartments',...row,destination:{kind:'detail',reference:row.reference}};
}
export const calendarCopy = {
  en: {calendar:'Calendar', list:'List', previous:'Previous month', next:'Next month', today:'Today', agenda:'Day agenda', empty:'Nothing scheduled for this day.', open:'Open', pending:'Pending requests', more:'More', weekdays:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']},
  fr: {calendar:'Calendrier', list:'Liste', previous:'Mois précédent', next:'Mois suivant', today:'Aujourd’hui', agenda:'Programme du jour', empty:'Rien de prévu ce jour.', open:'Ouvrir', pending:'Demandes en attente', more:'Plus', weekdays:['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']},
  ln: {calendar:'Manaka', list:'Liste', previous:'Sanza eleki', next:'Sanza ekoya', today:'Lelo', agenda:'Makambo ya mokolo', empty:'Likambo moko te na mokolo oyo.', open:'Fungola', pending:'Bosengi ezali kozela', more:'Mosusu', weekdays:['Lom','Mwa','Mis','Min','Mit','Mos','Eye']},
  sw: {calendar:'Kalenda', list:'Orodha', previous:'Mwezi uliopita', next:'Mwezi ujao', today:'Leo', agenda:'Ratiba ya siku', empty:'Hakuna tukio siku hii.', open:'Fungua', pending:'Maombi yanayosubiri', more:'Zaidi', weekdays:['Jum','Jtt','Jnn','Jtn','Ali','Iju','Jmo']},
} as const;

export function localDate(instant:string, timeZone:string):string {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant));
  const get=(key:string)=>parts.find(part=>part.type===key)?.value??'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function monthBounds(month:string):{from:string;to:string} {
  const [year,number]=month.split('-').map(Number);
  const from=`${year}-${String(number).padStart(2,'0')}-01`;
  const end=new Date(Date.UTC(year,number,1));
  return {from,to:`${end.getUTCFullYear()}-${String(end.getUTCMonth()+1).padStart(2,'0')}-01`};
}
export function shiftMonth(month:string, amount:number):string {
  const [year,number]=month.split('-').map(Number);
  const next=new Date(Date.UTC(year,number-1+amount,1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth()+1).padStart(2,'0')}`;
}

export function restaurantEvent(row:{reservation_ref:string;starts_at:string;timezone_name:string;party_size:number;state:string},
    status:string, guests:string):CalendarEvent {
  return {marketplace:'restaurants',reference:row.reservation_ref,startsAt:row.starts_at,
    timeZone:row.timezone_name,title:`${row.party_size} ${guests}`,status,
    tone:row.state==='pending'?'pending':row.state==='accepted'||row.state==='arrived'?'confirmed':'muted',
    destination:{kind:'detail',reference:row.reservation_ref}};
}
