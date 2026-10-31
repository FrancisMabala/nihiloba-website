import {shiftDay, validDay} from "./service-time";

/** The reporting API counts UTC days; money dates are already calendar dates. */
export function reportPeriod(preset: "week" | "month", today = new Date().toISOString().slice(0, 10)) {
  if (!validDay(today)) throw new Error("invalid_report_date");
  const date = new Date(`${today}T00:00:00Z`);
  const start = preset === "month" ? `${today.slice(0, 7)}-01`
    : shiftDay(today, -((date.getUTCDay() + 6) % 7));
  return {start, end: today};
}

export const reportHelp = {
  en: {week: "This week", month: "This month", period: "Report period", end: "To",
    intro: "See how your work and recorded finances are doing.",
    dates: "Both dates are included. Activity is counted by UTC day.",
    activity: "Activity", published: "Services visible now", requests: "New requests", bookings: "New bookings",
    current: "Where these bookings stand now", details: "How to read this report",
    counts: "Requests and bookings were created during your chosen dates. Their status and service visibility are checked when you run the report.",
    unavailable: "We cannot yet show how many quotes became bookings.",
    finance: "Recorded money", received: "Receipts you recorded", surplus: "Recorded receipts minus recorded expenses",
    financeHelp: "These are your records, not bank-confirmed payments or verified profit.",
    moneyDates: "Bills count from their first issue date. Receipts and expenses use the date you recorded for them. Amounts still due include later receipts linked to those bills.",
    loading: "Preparing your report…", offline: "You’re offline. Your dates are kept; reconnect and try again."},
  fr: {week: "Cette semaine", month: "Ce mois-ci", period: "Période du rapport", end: "Au",
    intro: "Suivez votre activité et l’argent que vous avez enregistré.",
    dates: "Les deux dates sont incluses. L’activité suit les jours UTC.",
    activity: "Activité", published: "Services visibles actuellement", requests: "Nouvelles demandes", bookings: "Nouvelles réservations",
    current: "Situation actuelle de ces réservations", details: "Comprendre ce rapport",
    counts: "Les demandes et réservations ont été créées pendant les dates choisies. Leur état et la visibilité des services sont vérifiés au moment du rapport.",
    unavailable: "Le nombre de devis devenus des réservations n’est pas encore disponible.",
    finance: "Argent enregistré", received: "Encaissements enregistrés", surplus: "Encaissements moins dépenses",
    financeHelp: "Il s’agit de vos écritures, pas de paiements confirmés par une banque ni d’un bénéfice vérifié.",
    moneyDates: "Les factures suivent leur première date d’émission. Les encaissements et dépenses suivent la date que vous avez indiquée. Le reste à recevoir tient compte des encaissements ultérieurs liés à ces factures.",
    loading: "Préparation du rapport…", offline: "Vous êtes hors ligne. Vos dates sont conservées ; reconnectez-vous puis réessayez."},
  ln: {week: "Poso oyo", month: "Sanza oyo", period: "Eleko ya lapolo", end: "Kino",
    intro: "Tala misala mpe mbongo oyo okomi.",
    dates: "Mikolo nyonso mibale ekoti. Misala etangami na mikolo ya UTC.",
    activity: "Misala", published: "Misala oyo ezali komonana sikoyo", requests: "Masengi ya sika", bookings: "Ba réservation ya sika",
    current: "Ndenge ba réservation oyo ezali sikoyo", details: "Ndenge ya kotanga lapolo",
    counts: "Masengi mpe ba réservation esalemaki na mikolo oyo oponi. Statut na yango mpe misala oyo emonanaka etalami na ntango ya lapolo.",
    unavailable: "Motango ya ba devis oyo ekomi réservation ezali naino te.",
    finance: "Mbongo ekomami", received: "Mbongo ozwi oyo okomi", surplus: "Mbongo ozwi koleka depanse",
    financeHelp: "Oyo ezali makomi na yo, ezali te paiement oyo banki endimi to bénéfice oyo etalelami.",
    moneyDates: "Ba factures etangami na mokolo ya kobima ya liboso. Mbongo ozwi mpe depanse etangami na mikolo oyo okomi. Mbongo etikali etali mpe mbongo ozwi sima mpo na ba factures wana.",
    loading: "Kobongisa lapolo…", offline: "Internet ezali te. Mikolo oyo oponi ebombami; zongisa internet mpe meka lisusu."},
  sw: {week: "Wiki hii", month: "Mwezi huu", period: "Kipindi cha ripoti", end: "Hadi",
    intro: "Fuatilia kazi zako na fedha ulizorekodi.",
    dates: "Tarehe zote mbili zinajumuishwa. Shughuli huhesabiwa kwa siku za UTC.",
    activity: "Shughuli", published: "Huduma zinazoonekana sasa", requests: "Maombi mapya", bookings: "Nafasi mpya",
    current: "Hali ya sasa ya nafasi hizi", details: "Jinsi ya kusoma ripoti",
    counts: "Maombi na nafasi ziliundwa katika tarehe ulizochagua. Hali yake na kuonekana kwa huduma hukaguliwa wakati wa ripoti.",
    unavailable: "Bado hatuwezi kuonyesha idadi ya makadirio yaliyogeuka kuwa nafasi.",
    finance: "Fedha zilizorekodiwa", received: "Mapokezi uliyorekodi", surplus: "Mapokezi pungufu ya gharama",
    financeHelp: "Hizi ni rekodi zako, si malipo yaliyothibitishwa na benki wala faida iliyohakikiwa.",
    moneyDates: "Bili huhesabiwa kwa tarehe ya kwanza kutolewa. Mapokezi na gharama hutumia tarehe ulizoandika. Kiasi kinachodaiwa huzingatia pia mapokezi ya baadaye yanayohusiana na bili hizo.",
    loading: "Inaandaa ripoti…", offline: "Huna mtandao. Tarehe zako zimehifadhiwa; unganisha tena na ujaribu."},
} as const;
