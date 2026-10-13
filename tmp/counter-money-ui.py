from pathlib import Path
import sys

path = Path(sys.argv[1])
source = path.read_text(encoding='utf-8')

def swap(before, after):
    global source
    assert source.count(before) == 1, (path, source.count(before), before[:80])
    source = source.replace(before, after)

if 'shida-business' in str(path):
    swap("import { FoodTerms, ReceiptCard } from './restaurant-receipt';",
         "import { FoodTerms, ReceiptCard } from './restaurant-receipt';\nimport { RestaurantMoney } from './restaurant-money';")
    swap("type Basket={basket_ref:string;revision:number;quote:Terms|null;quote_ref:string|null;order_ref:string|null};",
         "type Basket={basket_ref:string;revision:number;quote:Terms|null;quote_ref:string|null;order_ref:string|null};\ntype CounterOrder=Order&{bill_group_ref?:string|null};")
    swap("[recent,setRecent]=useState<Order[]>([])", "[recent,setRecent]=useState<CounterOrder[]>([])")
    swap("[order,setOrder]=useState<Order|null>(null)", "[order,setOrder]=useState<Order|null>(null),[moneyGroupRef,setMoneyGroupRef]=useState<string|null>(null)")

source = source.replace('recent:Order[]', 'recent:CounterOrder[]')
swap("if(b){setBasket(b);setOrder(null);setDirty(true);}",
     "if(b){setBasket(b);setOrder(null);setMoneyGroupRef(null);setDirty(true);}")
swap("setBasket(created);setOrder(null);}", "setBasket(created);setOrder(null);setMoneyGroupRef(null);}")
swap("api.run<{current_order:Order}>(`${salesPath}/counter-baskets/${basket.basket_ref}/finalize`",
     "api.run<{current_order:Order;bill_group_ref?:string}>(`${salesPath}/counter-baskets/${basket.basket_ref}/finalize`")
swap("if(result){setOrder(result.current_order);setBasket(null);setLines([]);setPreference('');setRecent(old=>[result.current_order,...old].slice(0,20));",
     "if(result){setOrder(result.current_order);setMoneyGroupRef(result.bill_group_ref??null);setBasket(null);setLines([]);setPreference('');setRecent(old=>[{...result.current_order,bill_group_ref:result.bill_group_ref},...old].slice(0,20));")
swap("{t('receipt')}</Link></>}",
     "{t('receipt')}</Link></>}{moneyGroupRef&&<section><p>{workflowText(locale,'billReference')}: {moneyGroupRef}</p><RestaurantMoney key={`${path}:${moneyGroupRef}`} path={path} groupRef={moneyGroupRef} binding={binding} locale={locale}/></section>}")
swap("<ReceiptCard order={value} locale={locale}/></details>",
     "<ReceiptCard order={value} locale={locale}/>{value.bill_group_ref&&<button type=\"button\" onClick={()=>setMoneyGroupRef(value.bill_group_ref!)}>{workflowText(locale,'recordPayment')}</button>}</details>")
path.write_text(source, encoding='utf-8')
