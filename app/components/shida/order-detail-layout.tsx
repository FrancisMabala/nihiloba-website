import type {ReactNode} from 'react';
import './order-detail-layout.css';

/** Shared presentation only: marketplace adapters retain authorization and actions. */
export function OrderDetailLayout({name,reference,status,date,summary,progress,documents,children}:{name:string;reference:string;status:string;date:string;summary:ReactNode;progress:ReactNode;documents:ReactNode;children?:ReactNode}) {
 return <article className="shida-order-detail">
  <header className="shida-order-banner"><div><h2>{name}</h2><p>{reference}</p></div>{date&&<time>{date}</time>}<strong className="shida-order-status">{status}</strong></header>
  <div className="shida-order-columns"><div>{progress}{documents}</div><div>{summary}{children}</div></div>
 </article>;
}
