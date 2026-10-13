from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
source = path.read_text(encoding='utf-8')
copy = {
    'en': ("Bill reference", "Record payment", "After handover, record payment on the bill below. The handover receipt alone does not prove payment."),
    'fr': ("Référence de la facture", "Enregistrer un paiement", "Après la remise, enregistrez le paiement sur la facture ci-dessous. Le reçu de remise seul ne prouve pas un paiement."),
    'ln': ("Référence ya facture", "Koma mbongo efutami", "Nsima ya kopesa biloko, koma mbongo na facture oyo ezali awa na nse. Resi ya kopesa biloko yango moko elakisaka kofuta te."),
    'sw': ("Rejea ya bili", "Rekodi malipo", "Baada ya kukabidhi, rekodi malipo kwenye bili iliyo hapa chini. Risiti ya makabidhiano peke yake haithibitishi malipo."),
}
lines = source.splitlines(keepends=True)
for index, line in enumerate(lines):
    locale = next((key for key in copy if line.lstrip().startswith(key + ':')), None)
    if locale is None:
        continue
    reference, action, explanation = copy[locale]
    assert 'billReference:' not in line
    updated, count = re.subn(r"counterPayment:'[^']*'",
        f"billReference:'{reference}',recordPayment:'{action}',counterPayment:'{explanation}'", line)
    assert count == 1, (path, locale)
    lines[index] = updated
path.write_text(''.join(lines), encoding='utf-8')
