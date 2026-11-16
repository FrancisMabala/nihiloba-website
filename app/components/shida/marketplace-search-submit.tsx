/** Same native form submission on every public marketplace, compact on phones. */
export function MarketplaceSearchSubmit({label}:{label:string}){
 return <button className="button button-primary marketplace-search-submit" type="submit" aria-label={label}><span>{label}</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button>;
}
