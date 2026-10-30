import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import './transactions.css';
export function TransactionEmpty({locale,message,market}:{locale:keyof typeof mySpaceCopy;message:string;market:string}){
 return <div className="transaction-empty"><p>{message}</p><a href={`${locale==='en'?'':`/${locale}`}/shida/${market}`}>{mySpaceCopy[locale].browse} →</a></div>;
}
