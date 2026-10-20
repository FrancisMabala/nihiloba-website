type Locale = "en" | "fr" | "ln" | "sw";
const labels: Record<string, readonly string[]> = {
  progress: ["Order progress", "Suivi de commande", "Bolandi ya komande", "Maendeleo ya agizo"],
  processing: ["Order received", "Commande reçue", "Komande eyambami", "Agizo limepokelewa"],
  preparing: ["Preparing", "En préparation", "Bazali kobongisa", "Linaandaliwa"],
  ready: ["Ready for pickup", "Prête à retirer", "Ebongi mpo na kozwa", "Tayari kuchukuliwa"],
  out_for_delivery: ["Out for delivery", "En livraison", "Ezali koya", "Liko njiani"],
  collected: ["Collected", "Retirée", "Ezwami", "Limechukuliwa"],
  delivered: ["Delivered", "Livrée", "Epesami", "Limefikishwa"],
  awaiting_agreement: ["Waiting for agreement", "En attente d’accord", "Kozela boyokani", "Linasubiri makubaliano"],
  cancelled: ["Cancelled", "Annulée", "Elongolami", "Limeghairiwa"],
  declined: ["Declined", "Refusée", "Eboyami", "Limekataliwa"],
  rejected: ["Declined", "Refusée", "Eboyami", "Limekataliwa"],
  expired: ["Expired", "Expirée", "Ntango esili", "Muda umeisha"],
};
export function progressText(locale: Locale, key: string) {
  return labels[key]?.[["en", "fr", "ln", "sw"].indexOf(locale)] ?? labels.progress[0];
}
export type Timeline = {current: string; steps: string[]};
export function WenzeOrderTimeline({locale, timeline}: {locale: Locale; timeline?: Timeline}) {
  if (!timeline) return null;
  return <section aria-label={progressText(locale, "progress")} style={{marginBlock:"1.25rem"}}>
    <h3>{progressText(locale, "progress")}</h3>
    <p role="status"><strong>{progressText(locale, timeline.current)}</strong></p>
    <ol style={{display:"flex",flexWrap:"wrap",gap:".5rem",listStyle:"none",padding:0}}>
      {timeline.steps.map(step=><li key={step} aria-current={step===timeline.current?"step":undefined}
        style={{padding:".55rem .8rem",border:"1px solid #d9ded1",borderRadius:".5rem",
          background:step===timeline.current?"#193e32":"#f7f6f0",color:step===timeline.current?"#fff":"#193e32"}}>
        {progressText(locale,step)}
      </li>)}
    </ol>
  </section>;
}
