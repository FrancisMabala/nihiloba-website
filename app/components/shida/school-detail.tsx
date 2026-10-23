import Link from 'next/link';
import type { SchoolResult } from '@/app/services/shida/schools';
import type { SchoolEntryLocale } from './school-entry';
import './school-entry.css';

const copy = {
  en:{back:'All schools',unavailable:'This School page is temporarily unavailable.',about:'About this School',note:'SHIDA reviewed this School’s identity and authority. This does not certify educational quality or guarantee admission.'},
  fr:{back:'Toutes les écoles',unavailable:'Cette page est temporairement indisponible.',about:'À propos de cette école',note:'SHIDA a examiné l’identité et l’autorité de cette école. Cela ne certifie pas la qualité de l’enseignement et ne garantit pas l’admission.'},
  ln:{back:'Biteyelo nyonso',unavailable:'Lokasa oyo ezali te sikoyo.',about:'Makambo ya eteyelo',note:'SHIDA etali bomoto mpe ndingisa ya eteyelo. Yango ezali ndanga ya lolenge ya mateya to ya kondimama te.'},
  sw:{back:'Shule zote',unavailable:'Ukurasa huu haupatikani kwa sasa.',about:'Kuhusu shule hii',note:'SHIDA imekagua utambulisho na mamlaka ya shule. Hii si uthibitisho wa ubora wa elimu wala dhamana ya kuandikishwa.'},
} as const;

export function SchoolDetail({locale,result}:{locale:SchoolEntryLocale;result:SchoolResult}) {
  const t=copy[locale],back=locale==='en'?'/shida/ecole':`/${locale}/shida/ecole`;
  return <main className="school-entry"><div className="container">
    <nav aria-label="SHIDA" className="school-entry-breadcrumb"><Link href={back}>{t.back}</Link></nav>
    {result.kind==='found'?<><header className="school-entry-hero"><p className="school-entry-label">SHIDA ÉCOLE</p>
      <h1>{result.school.name}</h1><p>{result.school.school_type_label} · {result.school.commune}, {result.school.city}</p>
      <p>{result.school.verification_label}</p></header>
      <section className="school-entry-preparation"><h2>{t.about}</h2><p style={{whiteSpace:'pre-wrap'}}>{result.school.description}</p></section>
      <p className="school-entry-note">{t.note}</p></>:<section className="school-entry-status"><h1>{t.unavailable}</h1></section>}
  </div></main>;
}
