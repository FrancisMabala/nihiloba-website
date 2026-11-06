import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ButtonLink } from '../button-link';
import { BookIcon, BriefcaseIcon, HomeIcon } from '../icons';
import type { SchoolListResult } from '@/app/services/shida/schools';
import { schoolLandingCopy, schoolReleaseStatus } from '@/app/lib/school-landing-copy';
import { SchoolIllustration } from './school-illustration';
import './school-entry.css';

export type SchoolEntryLocale = keyof typeof schoolLandingCopy;
const path = (locale: SchoolEntryLocale) => locale === 'en' ? '/shida/ecole' : `/${locale}/shida/ecole`;

function BenefitIcon({ kind }: { kind: number }) {
  if (kind === 3) return <BookIcon/>;
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 0 ? <><path d="m2 11 14-7 14 7-14 7Z"/><path d="M7 14v9q9 6 18 0v-9M29 12v10"/></> : kind === 1 ? <><circle cx="16" cy="10" r="5"/><path d="M7 28v-4a9 9 0 0 1 18 0v4ZM5 6a4 4 0 0 0 0 8M27 6a4 4 0 0 1 0 8M3 25v-4q0-4 4-4m22 8v-4q0-4-4-4"/></> : <><rect x="4" y="8" width="24" height="20" rx="3"/><path d="M5 8V5h18v3m5 8H18v7h10"/><circle cx="22" cy="19.5" r=".7"/></>}
  </svg>;
}

export function schoolEntryMetadata(locale: SchoolEntryLocale): Metadata {
  return { title: 'SHIDA École', description: schoolLandingCopy[locale].intro, alternates: {
    canonical: path(locale), languages: { en: path('en'), fr: path('fr'), ln: path('ln'), sw: path('sw'), 'x-default': path('en') },
  } };
}

export function SchoolDirectory({ locale, listing, page=1 }: { locale: SchoolEntryLocale; listing: SchoolListResult; page?: number }) {
  const t = schoolLandingCopy[locale];
  const hasSchools = listing.kind === 'ready' && listing.items.length > 0;
  return <section className="school-entry-directory" id="schools" aria-labelledby="school-directory-title">
    <h2 id="school-directory-title">{hasSchools ? t.published : listing.kind === 'unavailable' ? t.unavailable : t.empty}</h2>
    {!hasSchools && listing.kind === 'ready' && <p>{t.emptyBody}</p>}
    {listing.kind === 'ready' && hasSchools && <div className="school-entry-directory-grid">{listing.items.map(school => <article key={school.school_ref}>
      <h3>{school.name}</h3><p>{school.school_type_label} · {school.commune}, {school.city}</p><p>{school.verification_label}</p>
      <Link href={`${path(locale)}/${school.school_ref}`}>{t.view} →</Link>
    </article>)}</div>}
    {listing.kind === 'ready' && (page > 1 || listing.nextPage) && <nav aria-label={t.published} className="school-entry-actions">
      {page > 1 && <Link href={`${path(locale)}?page=${page-1}#schools`}>{t.previous}</Link>}
      {listing.nextPage && <Link href={`${path(locale)}?page=${listing.nextPage}#schools`}>{t.next}</Link>}
    </nav>}
  </section>;
}

export function SchoolDirectoryLoading({ locale }: { locale: SchoolEntryLocale }) {
  return <section id="schools" className="school-entry-directory" aria-busy="true"><p role="status">{schoolLandingCopy[locale].loading}</p></section>;
}

export function SchoolEntry({ locale, listing, page=1, directory }: { locale: SchoolEntryLocale; listing?: SchoolListResult; page?: number; directory?: ReactNode }) {
  const t = schoolLandingCopy[locale];
  const business = `https://business.nihiloba.com/?lang=${locale}`;
  return <div className="school-entry">
    <div className="container">
      <header className="school-entry-hero">
        <div className="school-entry-heading"><p className="school-entry-label"><BenefitIcon kind={0}/> SHIDA École</p>
          <h1 lang="ln">Likita malamu<br/> ya kelasi na SHIDA.</h1>
          <p className="school-entry-subtitle">{t.subtitle}</p><p className="school-entry-intro">{t.intro}</p>
        </div>
        <SchoolIllustration/>
        <div className="school-entry-actions school-entry-hero-actions"><ButtonLink href={business} external>{t.manage}</ButtonLink><ButtonLink href="#discover-ecole" variant="secondary">{t.discover}</ButtonLink></div>
      </header>
      <section id="discover-ecole" className="school-entry-benefits" aria-labelledby="school-benefits-title">
        <h2 id="school-benefits-title">{t.benefits}</h2>
        <div className="school-entry-benefit-grid">{t.cards.map(([title, body], i) => <article key={title} className={`school-entry-benefit school-entry-tone-${i}`}><BenefitIcon kind={i}/><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </section>
      <section className="school-entry-audiences">
        <article><HomeIcon/><div><h2>{t.schools}</h2><p>{t.schoolBody}</p><ButtonLink href={business} external>{t.business}</ButtonLink></div></article>
        <article><BenefitIcon kind={1}/><div><h2>{t.families}</h2><p>{t.familyBody}</p><ButtonLink href="#schools" variant="secondary">{t.directory}</ButtonLink></div></article>
      </section>
      <aside className="school-entry-launch"><BriefcaseIcon/><div><h2>{t.release[schoolReleaseStatus]}</h2><p>{schoolReleaseStatus === 'preparation' ? t.target : t.gradual}</p></div></aside>
      {directory ?? (listing && <SchoolDirectory locale={locale} listing={listing} page={page}/>)}
    </div>
  </div>;
}
