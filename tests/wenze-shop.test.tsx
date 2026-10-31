import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {WenzeShopTrust} from '../app/components/shida/wenze-shop-trust';
import {shopState,canChangeShopVisibility,shopText,shopUsage} from '../app/lib/wenze-shop-copy';
describe('shop trust and visibility',()=>{
 it('keeps voluntary visibility separate from suspension',()=>{
  expect(shopState('active','false')).toBe('hidden');expect(shopState('inactive','false')).toBe('archived');expect(shopState('suspended','true')).toBe('suspended');
  expect(canChangeShopVisibility('suspended')).toBe(false);expect(canChangeShopVisibility('new_unknown_status')).toBe(false);
 });
 it('does not invent a violation from a policy reminder',()=>{
  const html=renderToStaticMarkup(<WenzeShopTrust status="active" locale="en"/>);
  expect(html).toContain('Seller commitment');expect(html).toContain('not a violation notice');expect(html).not.toContain('Shop suspended');
 });
 it('labels real suspension without inventing complaints or an expiry',()=>{
  const html=renderToStaticMarkup(<WenzeShopTrust status="suspended" locale="en"/>);
  expect(html).toContain('Shop suspended');expect(html).not.toContain('30 days');expect(html).not.toContain('3 violations');
 });
 it('provides all four languages',()=>{for(const l of ['en','fr','ln','sw'] as const)for(const k of ['trust','commitment','policyHelp','suspended','restriction','visibility'])expect(shopText(l,k)).not.toBe('—');});
});

 describe('shop usage',()=>{it('keeps tiny usage accurate and clamps invalid bounds',()=>{expect(shopUsage(1,1000)).toBe(0.1);expect(shopUsage(0,1000)).toBe(0);expect(shopUsage(1100,1000)).toBe(100);expect(shopUsage(-1,1000)).toBe(0);expect(shopUsage(1,0)).toBeNull();expect(shopUsage(Number.NaN,1000)).toBeNull();});});
