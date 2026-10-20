import type { SchoolReceiptResult, SchoolReceiptStatus } from '@/app/services/shida/school-receipts';

type Locale = 'fr' | 'en' | 'ln' | 'sw';

const copy = {
  fr: {
    title: 'Vérifier un reçu scolaire', number: 'Numéro du reçu',
    valid_school_recorded: 'Paiement enregistré par l’école',
    reversed: 'Paiement annulé', refunded: 'Paiement remboursé',
    missing: 'Ce reçu ne peut pas être vérifié. Vérifiez la référence auprès de l’école.',
    unavailable: 'Vérification momentanément indisponible. Réessayez plus tard.',
    note: 'Ce résultat montre le statut actuel du reçu. Un paiement enregistré par l’école n’est pas une confirmation du fournisseur de paiement.',
  },
  en: {
    title: 'Verify a school receipt', number: 'Receipt number',
    valid_school_recorded: 'Payment recorded by the school',
    reversed: 'Payment reversed', refunded: 'Payment refunded',
    missing: 'This receipt could not be verified. Check the reference with the school.',
    unavailable: 'Verification is temporarily unavailable. Try again later.',
    note: 'This shows the receipt’s current status. A school-recorded payment is not confirmation from a payment provider.',
  },
  ln: {
    title: 'Tala bosolo ya reçu ya eteyelo', number: 'Nimero ya reçu',
    valid_school_recorded: 'Eteyelo ekomisi lifuti',
    reversed: 'Lifuti elongolami', refunded: 'Mbongo ya lifuti ezongisami',
    missing: 'Tokoki kotala bosolo ya reçu oyo te. Tunsa eteyelo mpo na référence.',
    unavailable: 'Kotala bosolo ezali kosala te sikawa. Meka lisusu na nsima.',
    note: 'Oyo ezali kolakisa ezalela ya reçu sikawa. Lifuti oyo eteyelo ekomisi elakisi te ete mopesi ya kofuta andimisi yango.',
  },
  sw: {
    title: 'Thibitisha risiti ya shule', number: 'Nambari ya risiti',
    valid_school_recorded: 'Malipo yamerekodiwa na shule',
    reversed: 'Malipo yamebatilishwa', refunded: 'Malipo yamerejeshwa',
    missing: 'Risiti hii haikuweza kuthibitishwa. Hakikisha rejea yake na shule.',
    unavailable: 'Uthibitishaji haupatikani kwa sasa. Jaribu tena baadaye.',
    note: 'Hii inaonyesha hali ya sasa ya risiti. Malipo yaliyorekodiwa na shule si uthibitisho kutoka kwa mtoa huduma wa malipo.',
  },
} as const;

export function SchoolReceiptVerification({ locale, result }: { locale: Locale; result: SchoolReceiptResult }) {
  const t = copy[locale];
  const status: SchoolReceiptStatus | null = result.kind === 'found' ? result.receipt.status : null;
  return <main className="min-h-[60vh] bg-[#f7f1e7] px-5 pb-20 pt-36 text-[#082d25]">
    <section className="mx-auto max-w-2xl rounded-xl border border-[#d8cec0] bg-white p-6 shadow-sm sm:p-10">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#0d493c]">SHIDA École</p>
      <h1 className="text-3xl font-bold sm:text-4xl">{t.title}</h1>
      {result.kind === 'found' ? <div className="mt-8 rounded-lg border border-[#d8cec0] p-5">
        <p className="text-sm text-[#5d6b65]">{t.number}</p>
        <p className="mt-1 break-all font-mono text-lg font-semibold">{result.receipt.receipt_number}</p>
        <p role="status" className={`mt-5 rounded-md px-4 py-3 font-semibold ${status === 'valid_school_recorded' ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-950'}`}>{t[status!]}</p>
      </div> : <p role="status" className="mt-8 rounded-lg border border-[#d8cec0] bg-[#fffcf7] p-5 font-semibold">{t[result.kind]}</p>}
      <p className="mt-6 text-sm leading-relaxed text-[#5d6b65]">{t.note}</p>
    </section>
  </main>;
}
