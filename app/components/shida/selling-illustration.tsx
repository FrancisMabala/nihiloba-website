/** Small hand-authored decorative vectors; never stand in for a real listing image. */
export function SellingIllustration({kind}:{kind:"item"|"shop"}) {
  return <svg className="selling-illustration" viewBox="0 0 160 120" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="82" cy="66" rx="68" ry="49" fill="var(--accent-soft)"/>
    <g stroke="var(--accent-ink)" strokeWidth="2" strokeLinejoin="round">
      {kind==="item" ? <>
        <path d="m29 53 48-22 50 22-49 23Z" fill="var(--accent-soft)"/>
        <path d="M29 53v40l49 22V76Zm49 23 49-23v40l-49 22Z" fill="var(--mp-paper)"/>
        <path d="m53 42 49 23v15l-12 5V70L41 48" fill="var(--accent-soft)"/>
        <path d="m42 85 19 9M119 20v16m-8-8h16" strokeLinecap="round"/>
      </> : <>
        <path d="M32 50h96v57H32Z" fill="var(--mp-paper)"/>
        <path d="m25 48 10-24h90l10 24v9c0 12-22 12-22 0 0 12-22 12-22 0 0 12-22 12-22 0 0 12-22 12-22 0 0 12-22 12-22 0Z" fill="var(--accent-soft)"/>
        <path d="M47 48 53 24m16 24 2-24m20 24-2-24m24 24-6-24M43 76h30v31H43Zm43 0h30v20H86Z"/>
        <path d="M24 109h112" strokeLinecap="round"/>
      </>}
    </g>
  </svg>;
}
