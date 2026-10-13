from pathlib import Path

p = Path(r'C:\NIHILOBA\nihiloba-website\app\components\shida\restaurant-daily.tsx')
s = p.read_text(encoding='utf-8')
s = s.replace("type DayReport=DayState&{preview_revision:", "type DayReport=DayState&{bill_summary?:Record<Currency,{order_value:string;recorded_collections:string}>;preview_revision:", 1)
old = "<h3>{t('preview')} · {preview.local_date}</h3><div className=\"rst-daily-summary-grid\">"
new = "<h3>{t('preview')} · {preview.local_date}</h3>{preview.bill_summary&&<p>{t('billCoverage')}</p>}<div className=\"rst-daily-summary-grid\">"
assert old in s
s = s.replace(old, new, 1)
old = "<h4>{c}</h4><dl><div><dt>{t('cashReceipts')}</dt>"
new = "<h4>{c}</h4><dl>{preview.bill_summary&&<><div><dt>{t('orderValue')}</dt><dd>{preview.bill_summary[c].order_value}</dd></div><div><dt>{t('recordedCollections')}</dt><dd>{preview.bill_summary[c].recorded_collections}</dd></div></>}<div><dt>{t('cashReceipts')}</dt>"
assert old in s
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
