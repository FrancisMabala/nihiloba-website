import type {ServiceLocale} from "./services-category-experience";
const words = {
  en: {edit: "Edit this request", title: "Review your updated request", warning: "Providers must send a new quotation for the updated request before you can accept it. Earlier quotations stay in your history. The reply deadline stays the same.", confirm: "Publish these changes", back: "Back to quotations"},
  fr: {edit: "Modifier cette demande", title: "Vérifiez votre demande modifiée", warning: "Les prestataires devront envoyer un nouveau devis pour la demande modifiée avant que vous puissiez l’accepter. Les anciens devis restent dans votre historique. Le délai de réponse ne change pas.", confirm: "Publier ces modifications", back: "Retour aux devis"},
  ln: {edit: "Bongisa bosengi oyo", title: "Tala bosengi oyo obongisi", warning: "Bapesi mosala basengeli kotinda devis ya sika mpo na bosengi oyo ebongisami liboso ondima yango. Ba devis ya kala etikali na lisolo na yo. Ntango ya nsuka ya koyanola ebongwani te.", confirm: "Bimisa mbongwana oyo", back: "Zonga na ba devis"},
  sw: {edit: "Hariri ombi hili", title: "Kagua ombi lako lililobadilishwa", warning: "Watoa huduma lazima watume makadirio mapya kwa ombi lililobadilishwa kabla hujayakubali. Makadirio ya awali yanabaki kwenye historia yako. Mwisho wa kujibu haubadiliki.", confirm: "Chapisha mabadiliko haya", back: "Rudi kwenye makadirio"},
} as const;
export const revisionWords = (locale: ServiceLocale) => words[locale];
