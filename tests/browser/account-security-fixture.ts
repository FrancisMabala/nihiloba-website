import {expect,type Page} from '@playwright/test';
export async function fixture(page:Page,signedIn=true,configured=false){
 const state={registered:configured,email:configured,loginEmail:false,closed:false,message:'',replies:[] as string[],proof:false,removed:0,review:''};
 await page.route('**/api/shida/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,''),body=route.request().method()==='POST'?route.request().postDataJSON():{};
  const reply=(data:unknown,status=200)=>route.fulfill({status,json:data});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Synthetic user'}},signedIn?200:401);
  if(path.includes('/personal/security')){
   const base='/api/shida/personal/security',part=path.slice(base.length);
   if(part==='/profile')return reply({revision:'fixture-revision',values:{personal_name:'Synthetic user',city:'Kinshasa',country_code:'CD',preferred_language:'fr'},primary_phone:{masked:'•••• 0000',verified:true},neighborhood:null});
   if(part==='/recovery')return reply({methods:[]});
   if(part==='')return reply({login_email:state.loginEmail?'l***@example.test':null,login_email_verified:state.loginEmail,email:state.email?'s***@example.test':null,email_ready_at:'2026-01-01T00:00:00Z',protected:false,passkeys:state.registered?[{reference:'KEY_fixture',ready_at:'2026-01-01T00:00:00Z'}]:[]});
   if(part==='/login-email/start'){expect(body.email).toBe('login@example.test');return reply({reference:'SEC_login_email'});}
   if(part==='/login-email/verify'){expect(body).toEqual({reference:'SEC_login_email',code:'12345678'});state.loginEmail=true;return reply({verified:true});}
   if(part==='/phone')return reply({changes:[]});
   if(part==='/passkeys/register/options')return reply({reference:'SEC_fixture',options:{challenge:Buffer.alloc(32,7).toString('base64url'),rp:{id:'localhost',name:'SHIDA'},user:{id:Buffer.from('USR_fixture').toString('base64url'),name:'Synthetic user',displayName:'Synthetic user'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{residentKey:'required',userVerification:'required'},timeout:30000}});
   if(part==='/passkeys/register/verify'){expect(body.credential.response.attestationObject).toBeTruthy();state.registered=true;return reply({registered:true});}
   if(part==='/email/start')return reply({reference:'SEC_email'});
   if(part==='/email/verify'){expect(body.code).toBe('12345678');state.email=true;return reply({verified:true});}
   if(part==='/email/proof/start')return reply({reference:'SEC_proof'});
   if(part==='/email/proof/verify'){state.proof=true;return reply({authorization:'SEC_authorized'});}
   if(part==='/passkeys/revoke'){expect(state.proof).toBe(true);expect(body).toEqual({reference:'KEY_fixture',authorization:'SEC_authorized',confirmed:true});state.registered=false;state.removed++;return reply({revoked:true});}
   if(part==='/sessions/revoke'){expect(state.proof).toBe(true);expect(body.authorization).toBe('SEC_authorized');return reply({revoked:true});}
   if(part==='/delete/status')return reply({deletion:null});
   if(part==='/delete')return reply({eligible:false,obligations:[{reference:'WEW_fixture',kind:'wewa',action_path:'/shida/space/?view=support'}],retained_records:false});
   if(part==='/delete/reviews/cancel'){expect(body.reference).toBe('SCT_fixture');state.review='deletion_cancelled';return reply({state:state.review});}
   if(part==='/delete/reviews'){
    if(route.request().method()==='POST'){expect(state.proof).toBe(true);expect(body.confirmed).toBe(true);expect(body.authorization).toBe('SEC_authorized');expect(body.obligations).toEqual(['WEW_fixture']);state.review='deletion_requested';return reply({reference:'SCT_fixture',state:state.review,created_at:'2026-01-01',updated_at:'2026-01-01'});}
    return reply({requests:state.review?[{reference:'SCT_fixture',state:state.review,created_at:'2026-01-01',updated_at:'2026-01-01'}]:[]});
   }
  }
  if(path.includes('/personal/support')){
   if(route.request().method()==='POST'&&path.endsWith('/support'))state.message=body.message;
   if(path.endsWith('/reply'))state.replies.push(body.message);
   if(path.endsWith('/close'))state.closed=true;
   const ticket={public_ref:'SUP_fixture',category:'other',message:state.message,status:state.closed?'closed':'open',created_at:'2026-01-01T00:00:00Z'};
   if(path.endsWith('/support')&&route.request().method()==='GET')return reply({tickets:state.message?[ticket]:[]});
   return reply({ticket,messages:state.replies.map(message=>({sender_type:'user',message}))});
  }
  if(path==='/api/shida/recovery')return reply({reference:'REC_fixture'});
  if(path==='/api/shida/recovery/verify')return reply({submitted:true});
  return reply({},404);
 });
 return state;
}
