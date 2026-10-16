'use client';
import { scheduleCopy, type WeeklySchedule } from '@/app/lib/restaurant-schedule';
import { intakeSetupCopy } from '@/app/lib/restaurant-intake-setup-copy';
import { workText } from '@/app/lib/restaurant-work-copy';
import type { RestaurantLocale } from '@/app/services/shida/restaurants-client';
export function WeeklySummary({value,locale}:{value:WeeklySchedule;locale:RestaurantLocale}){
 const c=scheduleCopy[locale];
 return <><ul>{value.weekly_periods.map((p,i)=><li key={i}>{c.days[p.weekday]} · {p.start} → {p.end}{p.end<p.start?' (+1)':''}</li>)}</ul><p>{c.lead}: {value.minimum_lead_minutes} · {c.cutoff}: {value.cutoff_minutes}</p><p>{value.allow_tomorrow?c.tomorrowOn:c.todayOnly}</p></>;
}
export function WeeklyEditor({value,onChange,locale}:{value:WeeklySchedule;onChange:(v:WeeklySchedule)=>void;locale:RestaurantLocale}){
 const c=scheduleCopy[locale],u=intakeSetupCopy[locale],t=(k:string)=>workText(locale,k);
 return <><h3>{c.weekly}</h3><p>{u.weeklyHelp}</p>{value.weekly_periods.map((p,i)=><div className="rst-row" key={i}><label>{u.day}<select value={p.weekday} onChange={e=>onChange({...value,weekly_periods:value.weekly_periods.map((x,n)=>n===i?{...x,weekday:Number(e.target.value)}:x)})}>{c.days.map((day,n)=><option value={n} key={n}>{day}</option>)}</select></label>{(['start','end'] as const).map(k=><label key={k}>{u[k]}<input type="time" required value={p[k]} onChange={e=>onChange({...value,weekly_periods:value.weekly_periods.map((x,n)=>n===i?{...x,[k]:e.target.value}:x)})}/></label>)}<button type="button" onClick={()=>onChange({...value,weekly_periods:value.weekly_periods.filter((_,n)=>n!==i)})}>{t('remove')}</button></div>)}<button type="button" disabled={value.weekly_periods.length>=28} onClick={()=>onChange({...value,weekly_periods:[...value.weekly_periods,{weekday:0,start:'11:00',end:'14:00'}]})}>{t('add')}</button><details className="rst-intake-advanced"><summary>{u.advanced}</summary><p>{u.advancedHelp}</p>{(['minimum_lead_minutes','cutoff_minutes'] as const).map((key,i)=><label key={key}>{i?c.cutoff:c.lead}<input aria-label={i?c.cutoff:c.lead} type="number" required min={0} max={1440} value={Number.isNaN(value[key])?'':value[key]} onChange={e=>onChange({...value,[key]:e.target.value===''?NaN:Number(e.target.value)})}/><small>{i?c.cutoffHelp:c.leadHelp}</small></label>)}<label><input type="checkbox" checked={value.allow_tomorrow} onChange={e=>onChange({...value,allow_tomorrow:e.target.checked})}/>{c.tomorrow}</label><p>{u.tomorrowHelp}</p></details></>;
}
