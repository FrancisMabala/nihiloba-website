import React from 'react';
const paths={
 shop:'M3 10h18l-2-7H5z M4 10v11h16V10 M9 21v-7h6v7 M8 3l-1 7 M16 3l1 7',
 camera:'M3 6h5l2-3h4l2 3h5v15H3z M8 13a4 4 0 1 0 8 0 4 4 0 1 0-8 0',
 upload:'M12 16V3 M7 8l5-5 5 5 M4 15v6h16v-6',
 pin:'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14 M9 8a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
 tag:'M3 3h8l10 10-8 8L3 11z M7 7h.01',
 truck:'M2 5h12v13H2z M14 9h4l4 5v4h-8 M5 18a2 2 0 1 0 4 0 M16 18a2 2 0 1 0 4 0',
 settings:'M4 4h16v16H4z M8 4v16 M8 9h12 M13 14h4',
 clock:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 7v5l4 2',
 shield:'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
 hidden:'M2 2l20 20 M3 8l-1 4s4 7 10 7l4-1 M8 5l4-1c6 0 10 8 10 8l-3 4',
 archive:'M3 3h18v5H3z M5 8v13h14V8 M9 12h6',
 cash:'M2 5h20v14H2z M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0 M5 9v6 M19 9v6',
 phone:'M7 2h10v20H7z M10 18h4',
 card:'M2 5h20v14H2z M2 9h20 M5 15h5',
 info:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 11v6 M12 7h.01',
 chart:'M3 3v18h18 M8 17V9 M13 17V5 M18 17v-5'
} as const;
export function ShopIcon({name}:{name:keyof typeof paths}){return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;}
