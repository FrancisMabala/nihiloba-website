'use client';
import {useConfirmation,type ConfirmationLocale} from './confirmation-dialog';

export const discardChangesCopy={
 en:{title:'Discard unsaved changes?',description:'Only the changes in this form will be discarded. Previously saved information will be kept.',action:'Discard changes'},
 fr:{title:'Abandonner les modifications non enregistrées ?',description:'Seules les modifications de ce formulaire seront abandonnées. Les informations déjà enregistrées seront conservées.',action:'Abandonner les modifications'},
 ln:{title:'Kotika mbongwana oyo ebombami te?',description:'Kaka mbongwana ya formulaire oyo ekolongwa. Makambo obombaki liboso ekotikala.',action:'Tika mbongwana'},
 sw:{title:'Acha mabadiliko ambayo hujahifadhi?',description:'Mabadiliko katika fomu hii pekee yataondolewa. Taarifa zilizohifadhiwa awali zitabaki.',action:'Acha mabadiliko'}
};

/** Only for local form edits. Never use this for deleting saved drafts or uncertain writes. */
export function useDiscardChanges(locale:ConfirmationLocale){
 const {request,confirmation}=useConfirmation(locale),copy=discardChangesCopy[locale];
 return {confirmation,discard:(action:()=>void)=>request({title:copy.title,description:copy.description,confirmLabel:copy.action,severity:'warning',onConfirm:action})};
}
