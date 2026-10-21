import type {ServiceLocale} from "./services-category-experience";
const text = {
  available: ["Available requests", "Demandes disponibles", "Masengi oyo ezali", "Maombi yanayopatikana"],
  mine: ["My proposals", "Mes propositions", "Baproposition na ngai", "Mapendekezo yangu"],
  mineIntro: ["Your drafts and quotations across all your services.", "Vos brouillons et devis pour tous vos services.", "Ba brouillon mpe devis mpo na misala na yo nyonso.", "Rasimu na makadirio katika huduma zako zote."],
  service: ["Find requests for", "Trouver des demandes pour", "Luka masengi mpo na", "Tafuta maombi ya"],
  matching: ["Requests matching your selected service and area.", "Demandes correspondant au service et à la zone sélectionnés.", "Masengi oyo ekokani na mosala mpe zone oponi.", "Maombi yanayolingana na huduma na eneo ulilochagua."],
  empty: ["No matching requests right now.", "Aucune demande correspondante pour le moment.", "Bosengi moko te ekokani sikoyo.", "Hakuna maombi yanayolingana kwa sasa."],
  noServices: ["Add an available service before replying to requests.", "Ajoutez un service disponible avant de répondre aux demandes.", "Bakisa mosala oyo ezali liboso ya koyanola masengi.", "Ongeza huduma inayopatikana kabla ya kujibu maombi."],
  prepare: ["Prepare a quotation", "Préparer un devis", "Bongisa devis", "Andaa makadirio"],
  open: ["Open proposal", "Ouvrir la proposition", "Fungola proposition", "Fungua pendekezo"],
  saved: ["Private draft saved", "Brouillon privé enregistré", "Brouillon ya sekele ebombami", "Rasimu binafsi imehifadhiwa"],
  private: ["Only you can see this draft. The customer sees it after you review and submit it.", "Ce brouillon est privé. Le client le voit après votre vérification et votre envoi.", "Kaka yo okoki komona brouillon oyo. Kiliya akomona yango nsima ya kotala mpe kotinda.", "Rasimu hii ni binafsi. Mteja ataiona baada ya wewe kuikagua na kuituma."],
  save: ["Save private draft", "Enregistrer le brouillon privé", "Bomba brouillon ya sekele", "Hifadhi rasimu binafsi"],
  review: ["Review before sending", "Vérifier avant l’envoi", "Tala liboso ya kotinda", "Kagua kabla ya kutuma"],
  edit: ["Edit quotation", "Modifier le devis", "Bongisa devis", "Hariri makadirio"],
  submit: ["Send this quotation", "Envoyer ce devis", "Tinda devis oyo", "Tuma makadirio haya"],
  sent: ["Quotation saved for the customer", "Devis enregistré pour le client", "Devis ebombami mpo na kiliya", "Makadirio yamehifadhiwa kwa mteja"],
  question: ["Ask the customer a question", "Poser une question au client", "Tuna kiliya motuna", "Muulize mteja swali"],
  ask: ["Send question", "Envoyer la question", "Tinda motuna", "Tuma swali"],
  privateReply: ["Only you and this customer can read this exchange.", "Seuls vous et ce client pouvez lire cet échange.", "Kaka yo mpe kiliya oyo bokoki kotanga lisolo oyo.", "Ni wewe na mteja huyu tu mnaoweza kusoma mazungumzo haya."],
  wait: ["Wait for the customer’s reply before asking another question.", "Attendez la réponse du client avant de poser une autre question.", "Zela eyano ya kiliya liboso ya kotuna motuna mosusu.", "Subiri jibu la mteja kabla ya kuuliza swali lingine."],
  withdrawn: ["Withdraw this quotation", "Retirer ce devis", "Longola devis oyo", "Ondoa makadirio haya"],
  withdrawCheck: ["The customer will no longer be able to accept this quotation.", "Le client ne pourra plus accepter ce devis.", "Kiliya akoki lisusu kondima devis oyo te.", "Mteja hataweza tena kukubali makadirio haya."],
  sentVersion: ["Last quotation sent", "Dernier devis envoyé", "Devis ya suka etindami", "Makadirio ya mwisho yaliyotumwa"],
  changed: ["The customer changed the request. Read the new summary, save your revised draft and review it before sending.", "Le client a modifié sa demande. Lisez le nouveau résumé, enregistrez votre brouillon corrigé et vérifiez-le avant l’envoi.", "Kiliya abongisi bosengi. Tanga bokuse ya sika, bomba brouillon obongisi mpe tala yango liboso ya kotinda.", "Mteja amebadilisha ombi. Soma muhtasari mpya, hifadhi rasimu uliyorekebisha na uikague kabla ya kutuma."],
  scheduling: ["Kinshasa time. The appointment must still be available when the customer accepts.", "Heure de Kinshasa. Le créneau doit encore être libre au moment de l’acceptation du client.", "Ngonga ya Kinshasa. Ngonga esengeli kozala polele ntango kiliya andimi.", "Saa za Kinshasa. Nafasi lazima iwe wazi mteja anapokubali."],
} as const;
export function opportunityWords(locale: ServiceLocale) {
  const index = ({en: 0, fr: 1, ln: 2, sw: 3} as const)[locale];
  return Object.fromEntries(Object.entries(text).map(([key, values]) => [key, values[index]])) as {[K in keyof typeof text]: string};
}
