const copy: Record<string, readonly string[]> = {
  "submitted_orders": ["Orders submitted", "Commandes enregistrées", "Bakomande ebombami", "Maagizo yaliyohifadhiwa"],
  "minimumRequired": ["Minimum amount", "Montant minimum", "Mbongo ya moke", "Kiasi cha chini"],
  "today": [
    "Today",
    "Aujourd’hui",
    "Lelo",
    "Leo"
  ],
  "week": [
    "7 days",
    "7 jours",
    "Mikolo 7",
    "Siku 7"
  ],
  "month": [
    "30 days",
    "30 jours",
    "Mikolo 30",
    "Siku 30"
  ],
  "average_completed_food_value": [
    "Average completed food value",
    "Valeur moyenne des aliments remis",
    "Ntalo ya bilei na komande esili, na bokaboli",
    "Wastani wa thamani ya chakula kilichokamilika"
  ],
  "response_time": [
    "Seller response time",
    "Délai de réponse du vendeur",
    "Ntango ya eyano ya moteki",
    "Muda wa muuzaji kujibu"
  ],
  "preparation_time": [
    "Preparation time",
    "Temps de préparation",
    "Ntango ya kolamba",
    "Muda wa maandalizi"
  ],
  "timingHelp": [
    "Response: confirmation to first acceptance or rejection. Preparation: start to ready, for completed orders. Counter sales excluded.",
    "Réponse : confirmation à la première acceptation ou au refus. Préparation : début à prêt, pour les commandes terminées. Ventes au comptoir exclues.",
    "Eyano: kobanda kondima komande tii moteki andimi to aboyi. Kolamba: kobanda tii bilei ebongi, mpo na bakomande esili. Koteka na esika ekoti te.",
    "Jibu: uthibitisho hadi kukubaliwa au kukataliwa kwanza. Maandalizi: kuanza hadi tayari, kwa maagizo yaliyokamilika. Mauzo ya kaunta hayajumuishwi."
  ],
  "samples": [
    "measured orders",
    "commandes mesurées",
    "bakomande etangami",
    "maagizo yaliyopimwa"
  ],
  "seconds": [
    "seconds",
    "secondes",
    "basekonde",
    "sekunde"
  ],
  "notAvailable": [
    "Not available",
    "Non disponible",
    "Ezali te",
    "Haipatikani"
  ],
  "popular": [
    "Popular foods · completed quantities",
    "Aliments populaires · quantités terminées",
    "Bilei batindaka mingi · motango esili",
    "Vyakula maarufu · idadi iliyokamilika"
  ],
  "portions": [
    "monetary portions",
    "portions par montant",
    "biteni na mbongo",
    "sehemu kwa kiasi"
  ],
  "fulfilment": [
    "Fulfilment · submitted / completed",
    "Remise · reçues / terminées",
    "Kopesa · eyambami / esili",
    "Utekelezaji · yaliyowasilishwa / yaliyokamilika"
  ],
  "paymentNote": [
    "Food value and delivery fees are not proof of payment. Currencies stay separate.",
    "La valeur des aliments et les frais de livraison ne prouvent pas le paiement. Les devises restent séparées.",
    "Ntalo ya bilei mpe ya komema ezali elembeteli ya kofuta te. Mbongo ya ndenge na ndenge ekabwani.",
    "Thamani ya chakula na ada za usafirishaji si uthibitisho wa malipo. Sarafu zinabaki tofauti."
  ],
  "amount_mode": [
    "Portion pricing",
    "Tarification des portions",
    "Ntalo ya biteni",
    "Bei za sehemu"
  ],
  "configured": [
    "Choose fixed amounts",
    "Montants au choix prédéfinis",
    "Mbongo oyo oponi liboso",
    "Chagua kiasi kilichowekwa"
  ],
  "flexible": [
    "Customer chooses an amount",
    "Montant choisi par le client",
    "Mosombi apona mbongo",
    "Mteja anachagua kiasi"
  ],
  "amount_step": [
    "Amount increment (optional)",
    "Palier de montant (facultatif)",
    "Litambe ya mbongo (soki olingi)",
    "Ongezeko la kiasi (hiari)"
  ],
  "flexibleFrom": [
    "Amount of your choice from",
    "Montant au choix dès",
    "Mbongo olingi kobanda",
    "Kiasi unachochagua kuanzia"
  ]
};
export const basicText=(locale:string,key:string)=>copy[key]?.[["en","fr","ln","sw"].indexOf(locale)] ?? "—";
