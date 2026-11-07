type Methods = {email:string|null;email_ready_at:string|null;passkeys:{ready_at:string}[]};

/** UX preflight only. The server still verifies method age and a fresh action proof. */
export function deletionVerificationIssue(methods:Methods,preferEmail=false,now=Date.now()) {
 const matureKey=methods.passkeys.some(key=>Date.parse(key.ready_at)<=now);
 if((preferEmail||!matureKey)&&methods.email)
  return methods.email_ready_at&&Date.parse(methods.email_ready_at)<=now?null:'security_method_not_ready';
 if(matureKey)return null;
 return methods.passkeys.length?'security_method_not_ready':'security_method_missing';
}
