from pathlib import Path

root=Path(r'C:\NIHILOBA\shida-business')
p=root/'components/restaurant-counter.tsx'
s=p.read_text(encoding='utf-8')
old="{moneyGroupRef&&<section><p>{workflowText(locale,'billReference')}: {moneyGroupRef}</p><RestaurantMoney"
new="{moneyGroupRef&&<section>{order?.bill_group_ref!==moneyGroupRef&&<p>{workflowText(locale,'billReference')}: {moneyGroupRef}</p>}<RestaurantMoney"
assert old in s
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
(root/'lib/restaurant-money-copy.ts').write_bytes(Path(r'C:\NIHILOBA\nihiloba-website\app\lib\restaurant-money-copy.ts').read_bytes())
