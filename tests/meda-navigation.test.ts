import {describe,it,expect} from 'vitest';
import {medaDestination} from '../app/lib/meda-navigation';
import {medaDiscoveryCopy} from '../app/lib/meda-discovery-copy';
import {readMedaFilters,routeLabel} from '../app/components/shida/meda-discovery';
describe('Meda shared destinations and discovery',()=>{
 for(const locale of ['en','fr','ln','sw'] as const)it(`preserves account workflow and locale ${locale}`,()=>{
  const prefix=locale==='en'?'':'/'+locale;
  const conversation=new URL(medaDestination(locale,'conversation','MEQ_example'), 'https://nihiloba.com');
  expect(conversation.pathname).toBe(prefix+'/shida/space/');
  expect(Object.fromEntries(conversation.searchParams)).toEqual({view:'messages',market:'meda',meda_view:'conversation',ref:'MEQ_example'});
  expect(medaDestination(locale,'create')).toContain('view=listings&tab=meda&meda_view=create');
  expect(medaDestination(locale,'mine')).toBe(prefix+'/shida/space/?view=listings&tab=meda');
  expect(medaDestination(locale,'enquiries',undefined,'MED_a')).toContain('listing=MED_a');
  expect(Object.keys(medaDiscoveryCopy[locale]).sort()).toEqual(Object.keys(medaDiscoveryCopy.en).sort());
  expect(Object.values(medaDiscoveryCopy[locale]).every(v=>v.trim())).toBe(true);
 });
 it('restores only supported discovery filter values',()=>{
  expect(readMedaFilters(new URLSearchParams('side=request&category=airport&origin=Paris&destination=CD&after=2027-01-02'))).toEqual({side:'request',category:'airport',origin:'Paris',destination:'CD',after:'2027-01-02'});
  expect(readMedaFilters(new URLSearchParams('side=admin&category=secret&after=invalid'))).toMatchObject({side:'offer',category:'',after:''});
  expect(routeLabel('CD','fr')).toMatch(/Congo/);expect(routeLabel('Kinshasa','fr')).toBe('Kinshasa');
 });
});
