// A saved profile label is not a login, logout, or change of Personal identity.
// Receivers refresh canonical session data; this notification grants no access.
export const PERSONAL_PROFILE_EVENT='shida-personal-profile-updated';
export function announcePersonalProfileChange(){
 window.dispatchEvent(new Event(PERSONAL_PROFILE_EVENT));
 // Cross-tab notification only: never profile values, account references or drafts.
 try{localStorage.setItem(PERSONAL_PROFILE_EVENT,crypto.randomUUID());}catch{/* Same-tab refresh and ordinary focus checks still work. */}
}
