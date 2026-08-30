"use client";

import { useState, useSyncExternalStore } from "react";
import type { Locale } from "../../lib/i18n";

const STORAGE_KEY = "nihiloba_saved_public_jobs";
const STORAGE_EVENT = "nihiloba-saved-jobs-change";
const copy = {
  en: { save: "Save", saved: "Saved", share: "Share", shared: "Link copied", report: "Report offer" },
  fr: { save: "Enregistrer", saved: "Enregistrée", share: "Partager", shared: "Lien copié", report: "Signaler l’offre" },
} as const;

function savedReferences(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 100) : [];
  } catch { return []; }
}

export function JobPublicActions({ locale, jobReference, title, path, compact = false }: { locale: Locale; jobReference: string; title: string; path: string; compact?: boolean }) {
  const t = copy[locale];
  const saved = useSyncExternalStore((onChange) => { window.addEventListener("storage", onChange); window.addEventListener(STORAGE_EVENT, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(STORAGE_EVENT, onChange); }; }, () => savedReferences().includes(jobReference), () => false);
  const [shared, setShared] = useState(false);

  function toggleSaved() {
    const current = savedReferences();
    const next = current.includes(jobReference) ? current.filter((item) => item !== jobReference) : [...current, jobReference].slice(-100);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { return; }
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
    } catch { /* Cancellation and unavailable clipboard leave the page unchanged. */ }
  }

  const reportHref = `mailto:support@nihiloba.com?subject=${encodeURIComponent(`Report public job ${jobReference}`)}`;
  return <div className={compact ? "job-public-actions job-public-actions-compact" : "job-public-actions"}>
    <button type="button" className="job-action-button" aria-pressed={saved} onClick={toggleSaved}>{saved ? t.saved : t.save}</button>
    <button type="button" className="job-action-button" onClick={() => void share()}>{shared ? t.shared : t.share}</button>
    {!compact && <a className="job-action-button" href={reportHref}>{t.report}</a>}
    <span className="sr-only" role="status" aria-live="polite">{shared ? t.shared : saved ? t.saved : ""}</span>
  </div>;
}
