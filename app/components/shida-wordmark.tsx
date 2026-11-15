// Shared verbatim with NIHILOBA Web's marketplace wordmark.
import Link from 'next/link';
import './shida-wordmark.css';
export function ShidaWordmark({home,shida}:{home:string;shida:string}){
 return <span className="market-brand-group"><Link className="market-home" href={home}>NIHILOBA</Link><Link className="market-brand" href={shida}>SHIDA</Link></span>;
}
