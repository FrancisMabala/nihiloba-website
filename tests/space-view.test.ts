import {describe,it,expect} from 'vitest';
import {resolveSpaceView} from '../app/lib/space-view';
describe('My Space compatible route resolution',()=>{
 it.each([undefined,'home','overview','unknown'])('opens Activities for %s',value=>expect(resolveSpaceView(value)).toBe('management'));
 it.each(['management','transactions','messages','settings','recovery','support','orders','requests','receipts'] as const)('preserves %s',value=>expect(resolveSpaceView(value)).toBe(value));
 it('preserves inbox aliases',()=>{expect(resolveSpaceView('inbox')).toBe('messages');expect(resolveSpaceView(undefined,true)).toBe('messages');});
});
