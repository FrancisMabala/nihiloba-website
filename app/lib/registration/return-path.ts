// Only local SHIDA destinations; never accept a credential-bearing/external URL.
export function registrationReturnPath(value: string | null, fallback: string): string {
  // Only read-only Meda destinations. Queries never authorize an action. Avoid
  // decode/normalize-before-validation accepting encoded separators or duplicates.
  if(value && /^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/(?:meda|space)\/?\?/.test(value) && !/[\\#%\s]/.test(value)) {
    const [path,query]=value.split('?');
    if(value.split('?').length!==2)return fallback;
    const params=new URLSearchParams(query);
    if([...params.keys()].some(key=>params.getAll(key).length!==1))return fallback;
    const ref=params.get('ref'),listing=params.get('listing');
    const listingRef=(item:string|null)=>!!item&&/^MED_[A-Za-z0-9_-]{1,60}$/.test(item);
    const enquiryRef=(item:string|null)=>!!item&&/^MEQ_[A-Za-z0-9_-]{1,60}$/.test(item);
    if(/\/meda\/?$/.test(path)&&params.size===2&&params.get('view')==='detail'&&listingRef(ref))return value;
    if(/\/space\/?$/.test(path)) {
      const view=params.get('view'),section=params.get('meda_view');
      if(view==='listings'&&params.get('tab')==='meda'&&[...params.keys()].every(key=>['view','tab','meda_view','ref'].includes(key))&&
         ((!section&&!ref)||(section==='create'&&!ref)||(section==='mine'&&!ref)||(section==='detail'&&listingRef(ref))))return value;
      if(view==='messages'&&params.get('market')==='meda'&&[...params.keys()].every(key=>['view','market','meda_view','ref','listing'].includes(key))&&
         ((section==='conversation'&&enquiryRef(ref)&&!listing)||((!section||section==='enquiries')&&!ref&&(!listing||listingRef(listing)))))return value;
    }
    return fallback;
  }
  // Only this public, non-credential action may survive a registration return.
  // A URL alone never performs the write; the destination still authenticates
  // and asks the returning user to continue the action.
  if (value && /^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/emplois\/[A-Za-z0-9_-]+\/?\?job-action=(?:save|unsave|follow|unfollow)$/.test(value)) return value;
  if (!value || !/^\/(?:fr\/|en\/|ln\/|sw\/)?shida(?:\/[A-Za-z0-9_-]+)*\/?$/.test(value) || /[\\?#\s]/.test(value) || /\/register(?:\/|$)/.test(value)) return fallback;
  return value;
}
