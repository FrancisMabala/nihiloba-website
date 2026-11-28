'use client';

import {statisticsCopy,statisticsLocale} from '../../lib/website-statistics-consent';

export const COOKIE_PREFERENCES_ID='website-statistics-options';
export const OPEN_COOKIE_PREFERENCES='shida:cookie-preferences';

export function CookieSettingsButton({language,initial=false}:{language:string;initial?:boolean}){
 const t=statisticsCopy[statisticsLocale(language)];
 return <button type="button" className="website-cookie-settings" aria-haspopup="dialog" aria-controls={COOKIE_PREFERENCES_ID} onClick={event=>{
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES,{detail:event.currentTarget}));
 }}>{initial?t.customize:t.settings}</button>;
}
