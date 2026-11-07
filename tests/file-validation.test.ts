import {describe,it,expect} from 'vitest';
import {fileValidation} from '../app/lib/file-validation';
describe('localized upload validation',()=>{
 for(const locale of ['en','fr','ln','sw'] as const)it(`${locale}: distinguishes size and format without changing limits`,()=>{
  expect(fileValidation({size:10*1024*1024,type:'application/pdf'},locale,10,['application/pdf'],'PDF')).toBe('');
  const large=fileValidation({size:10*1024*1024+1,type:'application/pdf'},locale,10,['application/pdf'],'PDF');
  const type=fileValidation({size:1,type:'text/plain'},locale,10,['application/pdf'],'PDF');
  expect(large).toContain('10');expect(type).toContain('PDF');expect(type).not.toBe(large);
 });
});
