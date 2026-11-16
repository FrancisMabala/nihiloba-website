import {describe,it,expect} from 'vitest';
import {readOrderLocation,writeOrderLocation,orderBuckets} from '../app/lib/wenze-order-location';
describe('order navigation context',()=>{
 it('starts on all without accepting unknown statuses or invalid offsets',()=>{expect(readOrderLocation('')).toEqual({bucket:'all',search:'',offset:0,order:undefined});expect(readOrderLocation('?bucket=unknown&orderOffset=-20').offset).toBe(0);expect(readOrderLocation('?bucket=unknown').bucket).toBe('all');});
 for(const bucket of orderBuckets)it(`round trips ${bucket} and keeps shop and catalogue context`,()=>{const url=writeOrderLocation(new URL('https://example.test/fr/shida/seller/wenze?store=WNZ_test&search=existing'),bucket,'client & produit',20,'ORDER_test');expect(readOrderLocation(url.search)).toEqual({bucket,search:'client & produit',offset:20,order:'ORDER_test'});expect(url.searchParams.get('search')).toBe('existing');expect(url.searchParams.get('store')).toBe('WNZ_test');});
 it('clears completed detail and empty criteria',()=>{const url=writeOrderLocation(new URL('https://example.test/?order=OLD&orderSearch=old&orderOffset=20'),'all','',0);expect(url.searchParams.has('order')).toBe(false);expect(url.searchParams.has('orderSearch')).toBe(false);expect(url.searchParams.has('orderOffset')).toBe(false);});
});
