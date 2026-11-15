import {describe,it,expect} from 'vitest';
import {copyHours,hoursOverlap} from '../app/lib/restaurant-week-hours';
describe('weekly restaurant intervals',()=>{
 it('preserves split hours when copying only chosen days',()=>{const windows=[{weekday:0,start:'11:00',end:'14:00'},{weekday:0,start:'18:00',end:'22:00'},{weekday:1,start:'09:00',end:'10:00'},{weekday:2,start:'10:00',end:'12:00'}];const result=copyHours(windows,0,[0,1]);expect(result.filter(w=>w.weekday===1).map(w=>w.start)).toEqual(['11:00','18:00']);expect(result.filter(w=>w.weekday===2)).toEqual([windows[3]]);expect(windows).toHaveLength(4);});
 it('detects overnight overlap including Sunday into Monday',()=>{expect(hoursOverlap([{weekday:6,start:'22:00',end:'02:00'},{weekday:0,start:'01:00',end:'03:00'}])).toBe(true);expect(hoursOverlap([{weekday:5,start:'22:00',end:'02:00'},{weekday:6,start:'02:00',end:'04:00'}])).toBe(false);});
 it('does not flag separate lunch and evening intervals',()=>{expect(hoursOverlap([{weekday:0,start:'11:00',end:'14:00'},{weekday:0,start:'18:00',end:'22:00'}])).toBe(false);});
});
