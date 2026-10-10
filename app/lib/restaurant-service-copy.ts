const copy:Record<string,[string,string,string,string]> = {
  "title": [
    "Service",
    "Service",
    "Service",
    "Huduma"
  ],
  "scope": [
    "Staff-entered orders awaiting preparation. Counter POS records food already handed over.",
    "Commandes saisies par le personnel, à préparer. Le point de vente enregistre les plats déjà remis.",
    "Commandes ya basali mpo na kolamba. Esika ya koteka ekomaka bilei oyo epesami déjà.",
    "Oda zilizoingizwa na wahudumu kwa maandalizi. Kaunta huandika chakula kilichokabidhiwa tayari."
  ],
  "preparation": [
    "Preparation is handled in the owner Kitchen. Assigned Kitchen does not handle these rounds yet.",
    "La préparation passe par la Cuisine du responsable. La Cuisine attribuée ne traite pas encore ces commandes.",
    "Kolamba esalemaka na Kuku ya mokambi. Kuku ya mosali etalaka commandes oyo naino te.",
    "Maandalizi hufanywa kwenye Jikoni la msimamizi. Jikoni lililokabidhiwa halishughulikii oda hizi bado."
  ],
  "newGroup": [
    "Open staff-only group",
    "Ouvrir un groupe sans invité",
    "Fungola groupe ya basali",
    "Fungua kundi bila mgeni"
  ],
  "groups": [
    "Service groups",
    "Groupes de Service",
    "Bagroupe ya Service",
    "Makundi ya huduma"
  ],
  "staffOnly": [
    "Staff-only group — no phone required",
    "Groupe sans invité — aucun téléphone requis",
    "Groupe ya basali — téléphone esengeli te",
    "Kundi bila mgeni — simu haihitajiki"
  ],
  "confirmed": [
    "Guest link approved",
    "Lien approuvé par l’invité",
    "Invité andimi lien",
    "Mgeni ameidhinisha kiungo"
  ],
  "rounds": [
    "Individual rounds — payment not verified; no payable bill",
    "Commandes individuelles — paiement non vérifié ; aucun solde à payer",
    "Commandes moko moko — mbongo endimami te; ezali facture ya kofuta te",
    "Oda moja moja — malipo hayajahakikiwa; si bili ya kulipa"
  ],
  "more": [
    "Add another round",
    "Ajouter une commande",
    "Bakisa commande mosusu",
    "Ongeza oda nyingine"
  ],
  "send": [
    "Send for preparation",
    "Envoyer en préparation",
    "Tinda mpo na kolamba",
    "Tuma kwa maandalizi"
  ],
  "handover": [
    "Attest physical handover",
    "Attester la remise physique",
    "Ndima bopesi ya bilei",
    "Thibitisha kukabidhi chakula"
  ],
  "handoverConfirm": [
    "I physically handed this ready order to the recipient. Record restaurant attestation?",
    "J’ai remis cette commande prête au destinataire. Enregistrer l’attestation du restaurant ?",
    "Napesi commande oyo esili na moto oyo azali kozwa. Koma ndingisa ya restaurant?",
    "Nimekabidhi oda hii iliyo tayari kwa mpokeaji. Hifadhi uthibitisho wa mgahawa?"
  ],
  "attested": [
    "Physical handover attested by the restaurant",
    "Remise physique attestée par le restaurant",
    "Restaurant endimi bopesi ya bilei",
    "Mgahawa umethibitisha kukabidhi chakula"
  ],
  "staffRound": [
    "Staff-entered round",
    "Commande saisie par le personnel",
    "Commande ya mosali",
    "Oda iliyoingizwa na mhudumu"
  ],
  "guestRound": [
    "Guest QR round",
    "Commande QR de l’invité",
    "Commande QR ya invité",
    "Oda ya QR ya mgeni"
  ],
  "propose": [
    "Propose a guest link",
    "Proposer un lien à l’invité",
    "Senga invité andima lien",
    "Pendekeza kiungo kwa mgeni"
  ],
  "anchor": [
    "Guest order reference",
    "Référence de commande de l’invité",
    "Référence ya commande ya invité",
    "Rejeleo la oda ya mgeni"
  ],
  "proposalHelp": [
    "Use the guest’s original pickup order reference. The guest must approve on their own phone; ordering can continue without approval.",
    "Utilisez la référence originale de retrait de l’invité. Il doit approuver sur son téléphone ; le Service peut continuer sans approbation.",
    "Salela référence ya commande ya invité. Asengeli kondima na téléphone na ye; Service ekoki kokoba kozanga ndingisa.",
    "Tumia rejeleo la asili la oda ya mgeni. Lazima aidhinishe kwenye simu yake; huduma inaweza kuendelea bila idhini."
  ],
  "pending": [
    "Awaiting guest approval until",
    "En attente de l’invité jusqu’au",
    "Kozela ndingisa ya invité kino",
    "Inasubiri idhini ya mgeni hadi"
  ],
  "expired": [
    "This proposal expired or changed. Refresh and propose again.",
    "Cette proposition a expiré ou changé. Actualisez et proposez à nouveau.",
    "Proposition oyo esili to ebongwani. Tala lisusu mpe senga lisusu.",
    "Pendekezo hili limeisha au limebadilika. Onyesha upya na pendekeza tena."
  ],
  "approve": [
    "Approve",
    "Approuver",
    "Ndima",
    "Idhinisha"
  ],
  "decline": [
    "Decline",
    "Refuser",
    "Boya",
    "Kataa"
  ],
  "declined": [
    "Declined on this device. Staff-only ordering remains available.",
    "Refusé sur cet appareil. Le Service sans invité reste disponible.",
    "Oboyi na téléphone oyo. Service ya basali ekoki kokoba.",
    "Umekataa kwenye kifaa hiki. Huduma bila mgeni bado inapatikana."
  ],
  "approval": [
    "Your waiter proposes linking this visit to a Service group. Approving lets you see staff-entered rounds. It does not confirm payment.",
    "Votre serveur propose de lier cette visite à un groupe de Service. Votre approbation permet de voir les commandes du personnel. Elle ne confirme aucun paiement.",
    "Mosali asengi kosangisa visite oyo na groupe ya Service. Soki ondimi, okomona commandes ya basali. Ezali ndingisa ya kofuta te.",
    "Mhudumu anapendekeza kuunganisha ziara hii na kundi la huduma. Ukikubali utaona oda za wahudumu. Haimaanishi malipo yamethibitishwa."
  ],
  "lost": [
    "Service access ended. Protected data has been cleared.",
    "Accès au Service terminé. Les données privées ont été effacées.",
    "Accès ya Service esili. Données ya sekele elongwe.",
    "Ufikiaji wa huduma umeisha. Data binafsi imeondolewa."
  ],
  "stale": [
    "Connection interrupted or view changed. Refresh current state before acting.",
    "Connexion interrompue ou vue modifiée. Actualisez avant d’agir.",
    "Connexion ekatani to makambo ebongwani. Tala lisusu liboso ya kosala.",
    "Muunganisho umekatika au hali imebadilika. Onyesha upya kabla ya kutenda."
  ],
  "conflict": [
    "This action conflicted with current state. Review the refreshed group and quote before a new action.",
    "Cette action est en conflit avec l’état actuel. Vérifiez le groupe et le devis actualisés avant une nouvelle action.",
    "Action ekokani na makambo ya sika te. Tala groupe mpe ntalo lisusu liboso ya action mosusu.",
    "Kitendo kinakinzana na hali ya sasa. Kagua kundi na bei zilizoonyeshwa upya kabla ya kitendo kipya."
  ],
  "uncertain": [
    "Result unconfirmed. Refresh, then explicitly retry the original action online.",
    "Résultat non confirmé. Actualisez puis réessayez explicitement l’action originale en ligne.",
    "Résultat endimami te. Tala lisusu mpe meka action ya liboso na connexion.",
    "Matokeo hayajathibitishwa. Onyesha upya, kisha jaribu tena kitendo cha asili ukiwa mtandaoni."
  ],
  "retry": [
    "Retry original action",
    "Réessayer l’action originale",
    "Meka action ya liboso",
    "Jaribu kitendo cha asili tena"
  ],
  "empty": [
    "No assigned Service work here.",
    "Aucun Service attribué ici.",
    "Service epesami awa te.",
    "Hakuna huduma iliyokabidhiwa hapa."
  ],
  "closed": [
    "Closed to new rounds",
    "Fermé aux nouvelles commandes",
    "Ekangami mpo na commandes ya sika",
    "Imefungwa kwa oda mpya"
  ],
  "close": [
    "Close this group to new rounds",
    "Fermer ce groupe aux nouvelles commandes",
    "Kanga groupe mpo na commandes ya sika",
    "Funga kundi hili kwa oda mpya"
  ],
  "closeConfirm": [
    "Close this group? Its linked guest visit will also stop accepting new rounds.",
    "Fermer ce groupe ? La visite liée ne pourra plus ajouter de commande.",
    "Kanga groupe oyo? Visite oyo esangani ekoyamba commandes ya sika te.",
    "Funga kundi hili? Ziara iliyounganishwa pia haitapokea oda mpya."
  ],
  "grant": [
    "1. Grant Service permission",
    "1. Autoriser le Service",
    "1. Pesa ndingisa ya Service",
    "1. Toa ruhusa ya huduma"
  ],
  "revoke": [
    "Revoke Service permission",
    "Révoquer la permission Service",
    "Longola ndingisa ya Service",
    "Ondoa ruhusa ya huduma"
  ]
};
export function serviceText(locale:'en'|'fr'|'ln'|'sw',key:string){return copy[key]?.[['en','fr','ln','sw'].indexOf(locale)] ?? '—';}
