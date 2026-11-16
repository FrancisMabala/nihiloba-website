import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {rememberJobResults,jobResultsReturn,markJobResultsReturn,restoreJobResults} from '../app/lib/job-results-return';
let values:Map<string,string>;
const scrollTo=vi.fn();
beforeEach(()=>{values=new Map();scrollTo.mockClear();vi.stubGlobal('sessionStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)});vi.stubGlobal('location',new URL('https://fixture.invalid/fr/shida/emplois/?city=Kinshasa&page=2'));vi.stubGlobal('window',{scrollY:740,scrollTo});vi.stubGlobal('requestAnimationFrame',(fn:()=>void)=>fn());});
afterEach(()=>vi.unstubAllGlobals());
it('restores the exact filtered list and scroll once, after an explicit return',()=>{
 rememberJobResults('/fr/shida/emplois/example/');vi.stubGlobal('location',new URL('https://fixture.invalid/fr/shida/emplois/example/'));
 expect(jobResultsReturn('/fr/shida/emplois')).toBe('/fr/shida/emplois/?city=Kinshasa&page=2');markJobResultsReturn();
 vi.stubGlobal('location',new URL('https://fixture.invalid/fr/shida/emplois/?city=Kinshasa&page=2'));restoreJobResults();restoreJobResults();expect(scrollTo).toHaveBeenCalledExactlyOnceWith(0,740);
});
it('does not restore another offer, language, unrelated list or stale record',()=>{
 rememberJobResults('/fr/shida/emplois/example/');vi.stubGlobal('location',new URL('https://fixture.invalid/fr/shida/emplois/another/'));expect(jobResultsReturn('/fr/shida/emplois')).toBeNull();
 vi.stubGlobal('location',new URL('https://fixture.invalid/fr/shida/emplois/example/'));expect(jobResultsReturn('/sw/shida/emplois')).toBeNull();
 vi.spyOn(Date,'now').mockReturnValue(Date.now()+3600001);expect(jobResultsReturn('/fr/shida/emplois')).toBeNull();vi.restoreAllMocks();
});
it('does not interrupt navigation when browser storage is unavailable',()=>{
 vi.stubGlobal('sessionStorage',{getItem(){throw Error('denied');},setItem(){throw Error('denied');}});expect(()=>rememberJobResults('/fr/shida/emplois/example/')).not.toThrow();expect(jobResultsReturn('/fr/shida/emplois')).toBeNull();expect(()=>restoreJobResults()).not.toThrow();
});
