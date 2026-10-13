from pathlib import Path

p = Path(r'C:\NIHILOBA\shida-business\components\restaurant-counter.tsx')
s = p.read_text(encoding='utf-8')
s = s.replace("import { FoodTerms, ReceiptCard } from './restaurant-receipt';", "import { FoodTerms, ReceiptCard } from './restaurant-receipt';\nimport { RestaurantMoney } from './restaurant-money';\ntype CounterOrder=Order&{bill_group_ref?:string|null};", 1)
s = s.replace("[recent,setRecent]=useState<Order[]>([])", "[recent,setRecent]=useState<CounterOrder[]>([])", 1)
s = s.replace("[order,setOrder]=useState<Order|null>(null),[plate,setPlate]", "[order,setOrder]=useState<Order|null>(null),[moneyGroupRef,setMoneyGroupRef]=useState<string|null>(null),[plate,setPlate]", 1)
p.write_text(s, encoding='utf-8')
