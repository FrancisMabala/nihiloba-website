import {expect,it} from 'vitest';
import {parseLocalDraft,internationalPhone,FORM_DRAFT_TTL} from '../app/lib/registration/local-draft';
it('restores only bounded untrusted form content before its deadline',()=>{
 const d={version:1,expires:100+FORM_DRAFT_TTL,kind:'personal',values:{personal_name:'Synthetic'},phone:'+243910004001'};
 expect(parseLocalDraft(JSON.stringify(d),100)).toEqual(d);
 expect(parseLocalDraft(JSON.stringify(d),d.expires)).toBeNull();
 expect(parseLocalDraft(JSON.stringify({...d,values:{code:'123456'}}),100)).toBeNull();
 expect(parseLocalDraft(JSON.stringify({...d,values:{token:'private'}}),100)).toBeNull();
 expect(parseLocalDraft(JSON.stringify({...d,values:{city:'x'.repeat(501)}}),100)).toBeNull();
 expect(parseLocalDraft('not-json',100)).toBeNull();
});
it('requires explicit international formatting without guessing identity',()=>{
 expect(internationalPhone('00 243 910 004 001')).toBe('+243910004001');
 expect(internationalPhone('+243 (910) 004-001')).toBe('+243910004001');
 for(const v of ['0910004001','+012345678','+243abc910004001','+123','+1234567890123456'])expect(internationalPhone(v)).toBeNull();
});
it('restores supported language without accepting arbitrary locale values',()=>{
 const draft={version:1,expires:100+FORM_DRAFT_TTL,kind:'personal',values:{first_name:'Jean',family_name:'Mabala'},phone:'+46910004001',language:'ln'};
 expect(parseLocalDraft(JSON.stringify(draft),100)).toEqual(draft);
 expect(parseLocalDraft(JSON.stringify({...draft,language:'invalid'}),100)).toBeNull();
});
