import {expect,it} from 'vitest';
import {notificationTimestamp,notificationLayoutCopy} from '../app/lib/notification-center-copy';
import {safeActivityUrl} from '../app/components/shida/notification-center';

it('uses local calendar days across month/year boundaries and keeps the full timestamp',()=>{
 const now=new Date(2026,0,1,10,0),today=new Date(2026,0,1,9,2),yesterday=new Date(2025,11,31,16,22);
 for(const locale of ['fr','en','ln','sw'] as const){
  expect(notificationTimestamp(today.toISOString(),locale,now).short).toContain(notificationLayoutCopy[locale].today);
  expect(notificationTimestamp(yesterday.toISOString(),locale,now).short).toContain(notificationLayoutCopy[locale].yesterday);
  expect(notificationTimestamp(yesterday.toISOString(),locale,now).full).toContain('2025');
 }
 expect(notificationTimestamp(new Date(2024,1,1).toISOString(),'fr',now).short).toContain('2024');
});
it('preserves report and question context without allowing foreign or credential-bearing links',()=>{
 for(const url of ['https://nihiloba.com/fr/shida/seller/wenze/?view=reports&store=WS_one&artifact=WRA_one','https://nihiloba.com/fr/shida/space/?view=questions&question=SCT_one'])expect(safeActivityUrl(url)).toBe(url);
 for(const url of ['javascript:alert(1)','https://nihiloba.com.attacker.test/','https://user:password@nihiloba.com/','http://nihiloba.com/'])expect(safeActivityUrl(url)).toBeUndefined();
});
