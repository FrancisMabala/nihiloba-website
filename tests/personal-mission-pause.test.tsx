import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {MissionActionConfirmation,missionManagementActions} from '../app/components/shida/personal-missions';
import {listingText,type MissionLocale} from '../app/lib/personal-missions-copy';
import {ManagedActivityList} from '../app/components/shida/managed-activity-list';
import type {ActivityData} from '../app/lib/use-personal-activity-data';

// These are server-rendered presentation and compatibility checks. Real dialog,
// focus, async interaction and viewport acceptance belong to independent browser QA.
describe('Personal job management compatibility',()=>{
 it.each(['open','paused','closed','hidden','draft'])('never invents lifecycle authority from legacy status %s',status=>{
  const actions=missionManagementActions({status});
  expect(actions).toEqual(status==='open'?['close','remove']:['remove']);
  expect(actions).not.toContain('pause');expect(actions).not.toContain('reactivate');
 });
 it('offers only explicitly returned supported management actions',()=>{
  expect(missionManagementActions({status:'open',allowed_actions:[]})).toEqual([]);
  expect(missionManagementActions({status:'open',allowed_actions:['edit','pause','close','remove','unrecognized']})).toEqual(['pause','close','remove']);
  expect(missionManagementActions({status:'paused',allowed_actions:['reactivate','remove']})).toEqual(['reactivate','remove']);
  expect(missionManagementActions({status:'paused',allowed_actions:['remove']})).toEqual(['remove']);
 });
});

describe.each(['fr','en','ln','sw'] as MissionLocale[])('Personal lifecycle copy in %s',locale=>{
 it.each(['pause','reactivate'] as const)('renders an explicit %s confirmation and cancel',action=>{
  const html=renderToStaticMarkup(<MissionActionConfirmation locale={locale} action={action} busy={false} onCancel={()=>{}} onConfirm={()=>{}}/>);
  expect(html).toContain(listingText(locale,action));
  expect(html).toContain(listingText(locale,'cancel'));
  expect(html).toContain(listingText(locale,action==='pause'?'pauseHelp':'reactivateHelp'));
  expect(html.match(/<button/g)).toHaveLength(2);
  expect(html).not.toContain('disabled');expect(html).not.toContain('<h');
 });
 it('disables both confirmation controls while saving',()=>{
  const html=renderToStaticMarkup(<MissionActionConfirmation locale={locale} action="pause" busy onCancel={()=>{}} onConfirm={()=>{}}/>);
  expect(html.match(/disabled=""/g)).toHaveLength(2);
 });
 it('labels paused jobs in the shared activity view without a public link',()=>{
  const current:ActivityData={binding:'synthetic',failed:false,items:[],options:[],loaded:[],more:false,markets:[],business:false,overview:{listings:[{type:'job',reference:'JOB_test',title:'Synthetic task',status:'paused'}],properties:[],travel:[],seeker:false}};
  const html=renderToStaticMarkup(<ManagedActivityList locale={locale} current={current} creation={null} onRetry={()=>{}}/>);
  expect(html).toContain(listingText(locale,'paused'));
  expect(html).toContain('offer=JOB_test');expect(html).not.toContain('/emplois/JOB_test');
 });
 it('provides nonempty local status and recovery messages',()=>{
  for(const key of ['paused','pause','reactivate','pausedSaved','reactivatedSaved','missionChanged','missionReconciled','missionUncertain','checkStatus'] as const){
   expect(listingText(locale,key).trim().length).toBeGreaterThan(3);
   expect(listingText(locale,key)).not.toBe(key);
  }
 });
});
