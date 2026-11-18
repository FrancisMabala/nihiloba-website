import {expect,it} from 'vitest';
import {acceptsAdultDeclaration} from '../app/lib/registration/eligibility';
it('requires an explicit supported age marker, with a bounded compatibility window',()=>{
 const before=Date.parse('2026-12-02T23:59:59Z'),end=Date.parse('2026-12-03T00:00:00Z');
 expect(acceptsAdultDeclaration('adult-v1',end)).toBe(true);
 expect(acceptsAdultDeclaration('adult-drc-v1',before)).toBe(true);
 expect(acceptsAdultDeclaration('adult-drc-v1',end)).toBe(false);
 for(const invalid of [null,'','false','true','adult-v2','adult-v1 ','ADULT-V1'])expect(acceptsAdultDeclaration(invalid,before)).toBe(false);
});
