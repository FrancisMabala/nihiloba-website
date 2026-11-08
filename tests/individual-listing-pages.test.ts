import {describe,expect,it,vi} from 'vitest';
import {collectListingPages} from '../app/lib/individual-listing-pages';

describe('complete authorized listing snapshots',()=>{
 it('follows sparse cursors, not row counts',async()=>{
  const read=vi.fn(async(offset:number)=>offset===0?{rows:['draft'],next_offset:100}:offset===100?{rows:[],next_offset:200}:{rows:['other draft'],next_offset:null});
  expect(await collectListingPages(read)).toEqual(['draft','other draft']);
  expect(read.mock.calls.map(call=>call[0])).toEqual([0,100,200]);
 });
 it('rejects a partial count after a failed page',async()=>{
  await expect(collectListingPages(async offset=>{if(offset)throw new Error('unavailable');return {rows:[1],next_offset:100};})).rejects.toThrow('unavailable');
 });
 it('rejects repeated cursors and stops after an account unmount',async()=>{
  await expect(collectListingPages(async()=>({rows:[],next_offset:0}))).rejects.toThrow('invalid_listing_cursor');
  const read=vi.fn();await expect(collectListingPages(read,()=>false)).rejects.toThrow('listing_session_changed');expect(read).not.toHaveBeenCalled();
 });
 it('bounds requests without presenting a truncated count',async()=>{
  const read=vi.fn(async(offset:number)=>({rows:[],next_offset:offset+100}));
  await expect(collectListingPages(read)).rejects.toThrow('listing_page_limit');expect(read).toHaveBeenCalledTimes(100);
 });
});
