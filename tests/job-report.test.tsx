import {describe, expect, it, vi, afterEach} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {JobReportLink} from "../app/components/shida/job-public-actions";
import {jobReportUrl} from "../app/lib/job-report-url";

afterEach(()=>vi.restoreAllMocks());
describe("job report WhatsApp handoff",()=>{
  it.each(["fr","en","ln","sw"] as const)("keeps %s message, destination and reference; never creates a ticket",locale=>{
    const fetch=vi.spyOn(globalThis,"fetch");
    const message=`Offre : Électricien & accueil\nEmployeur : Atelier Exemple\n\nSHIDA JOB REPORT JOB_EXAMPLE ${locale}`;
    const url=`https://wa.me/243990888777?text=${encodeURIComponent(message)}`;
    const html=renderToStaticMarkup(<JobReportLink locale={locale} jobReference="JOB_EXAMPLE" reportUrl={url}/>);
    expect(html).toContain(url);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toMatch(/mailto:|barua pepe|na email/);
    expect(fetch).not.toHaveBeenCalled();
    expect(new URL(jobReportUrl(url,"JOB_EXAMPLE")!).searchParams.get("text")).toBe(message);
  });
  it.each([
    undefined,null,"mailto:support@nihiloba.com","javascript:alert(1)",
    "https://other.example/?text=SHIDA%20JOB%20REPORT%20JOB_EXAMPLE%20fr",
    "https://wa.me/243990888777?text=SHIDA%20JOB%20REPORT%20JOB_OTHER%20fr",
    "https://wa.me/not-a-number?text=SHIDA%20JOB%20REPORT%20JOB_EXAMPLE%20fr",
    "https://wa.me/243990888777?text=SHIDA%20JOB%20REPORT%20JOB_EXAMPLE%20fr&token=not-allowed",
  ])("does not render unsafe, missing or mismatched action %s",url=>{
    expect(jobReportUrl(url,"JOB_EXAMPLE")).toBeNull();
    expect(renderToStaticMarkup(<JobReportLink locale="fr" jobReference="JOB_EXAMPLE" reportUrl={url}/>)).toBe("");
  });
});
