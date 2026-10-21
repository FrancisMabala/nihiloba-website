import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '../button-link';
import './school-entry.css';

export type SchoolEntryLocale = 'en' | 'fr' | 'ln' | 'sw';

const copy = {
  en: {
    title: 'SHIDA École for schools and families',
    intro: 'A private school workspace is being prepared for the November pilot. Public school discovery will begin only after a school chooses to publish and its profile is reviewed.',
    status: 'No schools are publicly listed yet.',
    statusDetail: 'A school’s private records and draft page never appear here automatically.',
    management: 'Manage a school',
    managementDetail: 'School operators can sign in to SHIDA Business, choose their authorized Organization and set up École. A verified school WhatsApp contact does not grant staff access.',
    dashboard: 'Open SHIDA Business',
    back: 'Back to SHIDA',
    preparation: 'What the pilot is preparing',
    items: [
      ['Private school setup', 'A School stays private while its operators verify the contact number and configure access.'],
      ['Daily administration', 'Authorized staff can work with academic years, classes, pupil records, fees, payments and stock.'],
      ['Optional public page', 'A School can prepare a draft. Publication requires verification, consent and review of the exact public content.'],
    ],
    note: 'SHIDA École is separate from the planned NIHILOBA Education learning initiative.',
  },
  fr: {
    title: 'SHIDA École pour les écoles et les familles',
    intro: 'Un espace privé pour les écoles est en préparation pour le pilote de novembre. La découverte publique commencera seulement lorsqu’une école choisira de publier sa page et que celle-ci aura été examinée.',
    status: 'Aucune école n’est encore publiée.',
    statusDetail: 'Les dossiers privés et les brouillons des écoles n’apparaissent jamais ici automatiquement.',
    management: 'Gérer une école',
    managementDetail: 'Les responsables peuvent se connecter à SHIDA Business, choisir leur organisation autorisée et configurer École. Un numéro WhatsApp scolaire vérifié ne donne aucun accès au personnel.',
    dashboard: 'Ouvrir SHIDA Business',
    back: 'Retour à SHIDA',
    preparation: 'Ce que prépare le pilote',
    items: [
      ['Configuration privée', 'L’école reste privée pendant la vérification du numéro de contact et la configuration des accès.'],
      ['Gestion quotidienne', 'Le personnel autorisé peut gérer les années scolaires, les classes, les élèves, les frais, les paiements et le stock.'],
      ['Page publique facultative', 'L’école peut préparer un brouillon. La publication exige vérification, consentement et examen du contenu public exact.'],
    ],
    note: 'SHIDA École est distinct du projet d’apprentissage NIHILOBA Education.',
  },
  ln: {
    title: 'SHIDA École mpo na biteyelo mpe mabota',
    intro: 'Esika ya mosala ya sekele mpo na biteyelo ezali kobongisama mpo na komeka na sanza ya zomi na moko. Bato bakomona eteyelo na polele kaka soki eteyelo eponi kobimisa lokasa na yango mpe lokasa yango etalami.',
    status: 'Eteyelo moko te ebimi na polele naino.',
    statusDetail: 'Makambo ya sekele mpe brouillon ya eteyelo ebimaka awa yango moko te.',
    management: 'Kokamba eteyelo',
    managementDetail: 'Bakambi bakoki kokota na SHIDA Business, kopona organisation na bango oyo epesami ndingisa mpe kobongisa École. Nimero ya WhatsApp ya eteyelo oyo endimisami epesaka basali ndingisa te.',
    dashboard: 'Fungola SHIDA Business',
    back: 'Zonga na SHIDA',
    preparation: 'Makambo oyo komeka ezali kobongisa',
    items: [
      ['Bobongisi ya sekele', 'Eteyelo etikalaka ya sekele ntango bazali kondimisa nimero ya kokutana mpe kobongisa bandingisa.'],
      ['Misala ya mokolo na mokolo', 'Basali oyo bazali na ndingisa bakoki kobongisa bambula ya kelasi, bakelasi, bana-kelasi, mbongo ya kelasi, lifuti mpe biloko.'],
      ['Lokasa ya polele soki balingi', 'Eteyelo ekoki kobongisa brouillon. Kobimisa yango esengeli kondimisa eteyelo, kozwa ndingisa mpe kotala makambo ya polele.'],
    ],
    note: 'SHIDA École ekeseni na programme ya boyekoli NIHILOBA Education oyo ebongisami.',
  },
  sw: {
    title: 'SHIDA École kwa shule na familia',
    intro: 'Eneo la faragha la shule linaandaliwa kwa majaribio ya Novemba. Utafutaji wa shule kwa umma utaanza tu baada ya shule kuchagua kuchapisha ukurasa wake na ukurasa huo kukaguliwa.',
    status: 'Hakuna shule zilizochapishwa kwa umma bado.',
    statusDetail: 'Taarifa za faragha na rasimu za shule hazionekani hapa moja kwa moja.',
    management: 'Simamia shule',
    managementDetail: 'Wasimamizi wanaweza kuingia SHIDA Business, kuchagua shirika lao lililoidhinishwa na kuandaa École. Nambari ya WhatsApp ya shule iliyothibitishwa haiwapi wafanyakazi ruhusa.',
    dashboard: 'Fungua SHIDA Business',
    back: 'Rudi SHIDA',
    preparation: 'Majaribio yanaandaa nini',
    items: [
      ['Uanzishaji wa faragha', 'Shule hubaki ya faragha wakati nambari ya mawasiliano inathibitishwa na ruhusa zinawekwa.'],
      ['Usimamizi wa kila siku', 'Wafanyakazi wenye ruhusa wanaweza kusimamia miaka ya masomo, madarasa, wanafunzi, ada, malipo na bidhaa.'],
      ['Ukurasa wa umma wa hiari', 'Shule inaweza kuandaa rasimu. Uchapishaji unahitaji uthibitishaji, idhini na ukaguzi wa maudhui halisi ya umma.'],
    ],
    note: 'SHIDA École ni tofauti na mpango wa masomo wa NIHILOBA Education unaopangwa.',
  },
} as const;

function path(locale: SchoolEntryLocale) {
  return locale === 'en' ? '/shida/ecole' : `/${locale}/shida/ecole`;
}

export function schoolEntryMetadata(locale: SchoolEntryLocale): Metadata {
  const t = copy[locale];
  return {
    title: t.title,
    description: t.intro,
    alternates: {
      canonical: path(locale),
      languages: { en: path('en'), fr: path('fr'), ln: path('ln'), sw: path('sw'), 'x-default': path('en') },
    },
  };
}

export function SchoolEntry({ locale }: { locale: SchoolEntryLocale }) {
  const t = copy[locale];
  const shidaPath = locale === 'en' ? '/shida' : `/${locale}/shida`;
  return <main className="school-entry">
    <div className="container">
      <nav aria-label="SHIDA" className="school-entry-breadcrumb"><Link href={shidaPath}>SHIDA</Link><span aria-hidden="true">/</span><span aria-current="page">École</span></nav>
      <header className="school-entry-hero">
        <p className="school-entry-label">SHIDA ÉCOLE</p>
        <h1>{t.title}</h1>
        <p className="school-entry-intro">{t.intro}</p>
        <div className="school-entry-actions"><ButtonLink href="https://business.nihiloba.com" external>{t.dashboard}</ButtonLink><ButtonLink href={shidaPath} variant="secondary">{t.back}</ButtonLink></div>
      </header>
      <section className="school-entry-status" aria-labelledby="school-entry-status-title">
        <h2 id="school-entry-status-title">{t.status}</h2><p>{t.statusDetail}</p>
      </section>
      <section aria-labelledby="school-entry-preparation-title" className="school-entry-preparation">
        <h2 id="school-entry-preparation-title">{t.preparation}</h2>
        <div className="school-entry-cards">{t.items.map(([title, detail]) => <article key={title}><h3>{title}</h3><p>{detail}</p></article>)}</div>
      </section>
      <section className="school-entry-management" aria-labelledby="school-entry-management-title"><h2 id="school-entry-management-title">{t.management}</h2><p>{t.managementDetail}</p><ButtonLink href="https://business.nihiloba.com" external variant="secondary">{t.dashboard}</ButtonLink></section>
      <p className="school-entry-note">{t.note}</p>
    </div>
  </main>;
}
