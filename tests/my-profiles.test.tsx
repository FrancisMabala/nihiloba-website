import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MyProfiles} from '../app/components/shida/my-profiles';
import {myProfilesCopy} from '../app/lib/my-profiles-copy';
import {resolveSpaceView} from '../app/lib/space-view';
import {dashboardActivities,type ManagedActivity} from '../app/lib/personal-activities';
import type {ActivityData} from '../app/lib/use-personal-activity-data';

const item:ManagedActivity={ref:'SRV_A',providerRef:'SPP_A',name:'Service A',professionalName:'Marie Services',market:'services',published:true,query:'offering=SRV_A',status:'active',location:'Goma',missing:[],individual:false,image:null};
const data:ActivityData={binding:'test',items:dashboardActivities([item,{...item,ref:'SRV_B',name:'Service B'}]),options:[],loaded:['services'],failed:false,more:false,markets:['services'],business:false};
describe('one account with linked marketplace profiles',()=>{
 it('keeps the profiles destination distinct from settings and activities',()=>{
  expect(resolveSpaceView('profiles')).toBe('profiles');expect(resolveSpaceView('settings')).toBe('settings');
 });
 it.each(['fr','en','ln','sw'] as const)('uses canonical editors without duplicating account fields in %s',locale=>{
  const html=renderToStaticMarkup(<MyProfiles locale={locale} binding="test" name="Test Person" data={data} onRetry={()=>{}}/>);
  expect(html).toContain(myProfilesCopy[locale].personal);
  expect(html.match(/Test Person/g)).toHaveLength(1);
  expect(html.match(/Marie Services/g)).toHaveLength(1);
  expect(html).toContain('view=settings#passkey-profile');
  expect(html).toContain('view=services&amp;provider=SPP_A');
  expect(html).not.toContain('<input');expect(html).not.toContain('https://business.nihiloba.com/');
 });
 it('does not call a partial profile list empty and keeps retry available',()=>{
  const html=renderToStaticMarkup(<MyProfiles locale="en" binding="test" name="Test Person" data={{...data,failed:true,items:[]}} onRetry={()=>{}}/>);
  expect(html).toContain('role="alert"');expect(html).toContain(myProfilesCopy.en.retry);
  expect(html).not.toContain(myProfilesCopy.en.empty);
 });
});
