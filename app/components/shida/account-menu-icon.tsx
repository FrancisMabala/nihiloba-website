// Shared account-navigation design contract; mirrored in both SHIDA frontends.
export function AccountIcon({name}:{name:"space"|"messages"|"settings"|"people"|"logout"}){
 const paths={space:"M8 7V4h8v3M3 7h18v14H3zM3 12h18M10 10v4h4v-4",messages:"M3 3h18v14H8l-5 4zM7 7h10M7 11h7",settings:"M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",people:"M2 21v-3a5 5 0 0 1 10 0v3M15 14a5 5 0 0 1 7 4v3M7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M17 10a3 3 0 1 0 0-6",logout:"M9 4H3v16h6M8 12h13M16 7l5 5-5 5"};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/>{name==="settings"&&<circle cx="12" cy="12" r="3"/>}</svg>;
}
