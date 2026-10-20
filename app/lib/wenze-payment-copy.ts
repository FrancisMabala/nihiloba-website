const copy: Record<string, [string,string,string,string]> = {
 title: ["Payment preferences","Préférences de paiement","Maponi ya lifuti","Mapendeleo ya malipo"],
 help: ["Choose how you accept payment outside SHIDA. These settings do not collect money or confirm payment.","Choisissez comment vous acceptez les paiements hors SHIDA. Ces réglages ne collectent pas d’argent et ne confirment pas les paiements.","Pona ndenge ozwa lifuti libanda ya SHIDA. Maponi oyo ezwaka mbongo te mpe endimisaka lifuti te.","Chagua jinsi unavyopokea malipo nje ya SHIDA. Mipangilio hii haikusanyi pesa wala kuthibitisha malipo."],
 cash: ["Cash","Espèces","Mbongo ya maboko","Taslimu"],
 mobile_money: ["Mobile money","Mobile money","Mbongo na telefone","Pesa kwa simu"],
 other: ["Other offline methods","Autres moyens hors ligne","Ndenge mosusu libanda ya SHIDA","Njia nyingine nje ya SHIDA"],
 card: ["Card","Carte bancaire","Karte ya banki","Kadi"],
 paypal: ["PayPal","PayPal","PayPal","PayPal"],
 soon: ["Coming soon","Bientôt disponible","Ekoya mosika te","Inakuja hivi karibuni"],
 save: ["Save preferences","Enregistrer les préférences","Bomba maponi","Hifadhi mapendeleo"],
 saved: ["Preferences saved.","Préférences enregistrées.","Maponi ebombami.","Mapendeleo yamehifadhiwa."],
 loading: ["Loading preferences…","Chargement des préférences…","Tozali kozwa maponi…","Inapakia mapendeleo…"],
 error: ["Could not save or load your preferences. Try again.","Impossible de charger ou d’enregistrer vos préférences. Réessayez.","Tokoki kozwa to kobomba maponi te. Meka lisusu.","Imeshindwa kupakia au kuhifadhi mapendeleo. Jaribu tena."],
 conflict: ["Your shop changed. Reload the latest preferences before saving again.","Votre boutique a changé. Rechargez les préférences avant de réessayer.","Butiki ebongwani. Zwá maponi ya sika liboso ya kobomba lisusu.","Duka limebadilika. Pakia mapendeleo ya sasa kabla ya kuhifadhi tena."],
 reload: ["Reload preferences","Recharger les préférences","Zwá maponi lisusu","Pakia tena mapendeleo"],
 leave: ["Leave without saving payment preferences?","Quitter sans enregistrer les préférences de paiement ?","Bima kozanga kobomba maponi ya lifuti?","Ondoka bila kuhifadhi mapendeleo ya malipo?"],
};
export function paymentText(locale:string,key:string) {
 return copy[key]?.[Math.max(0,["en","fr","ln","sw"].indexOf(locale))]??"";
}
