type Locale='en'|'fr'|'ln'|'sw';
const copy={
 title:['Request a deletion review','Demander une vérification de suppression','Senga botali ya kolongola konti','Omba ukaguzi wa kufuta akaunti'],
 help:['SHIDA can review unresolved obligations. A review does not bypass them.','SHIDA peut examiner les obligations à résoudre. La vérification ne les contourne pas.','SHIDA ekoki kotala mikumba oyo etikali. Botali ekolongola mikumba yango te.','SHIDA inaweza kukagua wajibu uliobaki. Ukaguzi hauupuuzi.'],
 message:['Explain what needs review','Expliquez le problème à examiner','Limbola likambo ya kotala','Eleza kinachohitaji ukaguzi'],
 consent:['This requests a review only. After obligations are resolved, you must confirm deletion yourself.','Cette demande concerne seulement une vérification. Une fois les obligations réglées, vous devrez confirmer vous-même la suppression.','Oyo ezali kaka lisengi ya botali. Nsima ya kosilisa mikumba, osengeli kondimisa kolongola yo moko.','Hili linaomba ukaguzi tu. Baada ya wajibu kutatuliwa, lazima uthibitishe ufutaji mwenyewe.'],
 resolved:['Review resolved — check eligibility and confirm deletion yourself','Vérification résolue — vérifiez votre éligibilité puis confirmez vous-même','Botali esili — tala soki okoki mpe ndimisa yo moko','Ukaguzi umetatuliwa — kagua ustahiki na uthibitishe mwenyewe'],
 refresh:['Check my review requests','Consulter mes demandes','Tala masengi na ngai','Angalia maombi yangu'],
 withdraw:['Withdraw request','Retirer la demande','Longola lisengi','Ondoa ombi'],
 sent:['Review request saved','Demande de vérification enregistrée','Lisengi ya botali ebombami','Ombi la ukaguzi limehifadhiwa'],
 empty:['No review requests','Aucune demande de vérification','Lisengi ya botali ezali te','Hakuna maombi ya ukaguzi'],
 requested:['Awaiting review','En attente de vérification','Kozela botali','Inasubiri ukaguzi'],
 clarification:['More information requested — open support','Précisions demandées — ouvrir le support','Basengi ndimbola — fungola lisungi','Maelezo zaidi yanahitajika — fungua usaidizi'],
 postponed:['Postponed — open support for next steps','Reportée — consulter le support pour la suite','Ezelisami — tala lisungi mpo na kokoba','Imeahirishwa — fungua usaidizi kwa hatua zinazofuata'],
 cancelled:['Withdrawn','Retirée','Elongolami','Limeondolewa'],
 superseded:['Replaced by a new request','Remplacée par une nouvelle demande','Lisengi ya sika ezwi esika','Limebadilishwa na ombi jipya'],
 completed:['Completed','Terminée','Esili','Limekamilika'],
 support:['Open support','Ouvrir le support','Fungola lisungi','Fungua usaidizi'],
} as const;
export function deletionReviewText(locale:Locale,key:keyof typeof copy){return copy[key][{en:0,fr:1,ln:2,sw:3}[locale]];}
export function deletionReviewState(locale:Locale,state:string){
 const key=({deletion_requested:'requested',deletion_clarification:'clarification',deletion_postponed:'postponed',deletion_cancelled:'cancelled',deletion_superseded:'superseded',deletion_completed:'completed',deletion_resolved:'resolved'} as const)[state as 'deletion_requested'];
 return key?deletionReviewText(locale,key):deletionReviewText(locale,'requested');
}
