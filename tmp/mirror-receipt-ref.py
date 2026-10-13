from pathlib import Path

root=Path(r'C:\NIHILOBA\shida-business\components')
p=root/'restaurant-receipt.tsx'
s=p.read_text(encoding='utf-8')
s=s.replace("import { workText } from '@/lib/restaurant-work-copy';", "import { workText } from '@/lib/restaurant-work-copy';\nimport { workflowText } from '@/lib/restaurant-workflow-copy';",1)
s=s.replace('export function ReceiptCard({order,locale}:{order:Order;locale:RestaurantLocale})', 'export function ReceiptCard({order,locale}:{order:Order&{bill_group_ref?:string|null};locale:RestaurantLocale})',1)
s=s.replace('<p>{order.order_ref}</p><p>{t(\'current\')}', '<p>{order.order_ref}</p>{order.bill_group_ref&&<p>{workflowText(locale,\'billReference\')}: {order.bill_group_ref}</p>}<p>{t(\'current\')}',1)
p.write_text(s,encoding='utf-8')
p=root/'restaurant-counter.tsx'
s=p.read_text(encoding='utf-8')
assert 'setOrder(result.current_order);setMoneyGroupRef' in s
s=s.replace('setOrder(result.current_order);setMoneyGroupRef','setOrder({...result.current_order,bill_group_ref:result.bill_group_ref});setMoneyGroupRef',1)
p.write_text(s,encoding='utf-8')
