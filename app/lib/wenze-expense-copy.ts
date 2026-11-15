import type {WenzeLocale} from './wenze-copy';
const copy = {
 scope:['About these amounts','À propos de ces montants','Na ntina ya mbongo oyo','Kuhusu kiasi hiki'],
 filters:['Filters','Filtres','Filtres','Vichujio'], sections:['Finance section','Rubrique finances','Eteni ya mbongo','Sehemu ya fedha'],
 details:['Expense details','Détail de la dépense','Makambo ya dépense','Maelezo ya matumizi'],
 cancelExpense:['Cancel this expense','Annuler cette dépense','Longola dépense oyo','Batilisha matumizi haya'],
 effect:['The original record and its history remain. Cancellation removes this expense from its original period’s totals. It does not refund money or change stock.','L’écriture et son historique sont conservés. L’annulation retire cette dépense des totaux de sa période d’origine. Elle ne rembourse rien et ne change pas le stock.','Écriture mpe historique na yango etikali. Kolongola dépense elongoli yango na total ya eleko na yango. Ezongisi mbongo te mpe ebongoli stock te.','Rekodi ya awali na historia yake vinabaki. Ubatilishaji huondoa matumizi haya kwenye jumla za kipindi chake. Haurudishi fedha wala kubadilisha stoo.'],
 privateNote:['Private note','Note privée','Note ya sekele','Maelezo binafsi'],
 add:['Add expense','Ajouter une dépense','Bakisa dépense','Ongeza matumizi'],
 total:['Total expenses','Total des dépenses','Dépenses nyonso','Jumla ya matumizi'],
 more:['Other actions','Autres actions','Misala mosusu','Vitendo vingine'],
 close:['Close','Fermer','Kanga','Funga'], registered:['Recorded','Enregistrée','Ekomami','Yamerekodiwa'], cancelled:['Cancelled','Annulée','Elongolami','Yamebatilishwa'],
 audit:['History and references','Historique et références','Historique mpe références','Historia na marejeleo'],
 reversal_reason:['Cancellation reason','Motif d’annulation','Ntina ya kolongola','Sababu ya kubatilisha'], reversal_note:['Cancellation note','Note d’annulation','Note ya kolongola','Maelezo ya ubatilishaji'],
 reversal_ref:['Cancellation reference','Référence d’annulation','Référence ya kolongola','Rejeleo la ubatilishaji'],
 reversed_at:['Cancelled on','Annulée le','Elongolami na','Tarehe ya ubatilishaji'],
 expense_ref:['Expense reference','Référence de la dépense','Référence ya dépense','Rejeleo la matumizi'],
 replacement_expense_ref:['Replacement expense','Dépense de remplacement','Dépense ya kozwa esika','Matumizi mbadala'],
 correction_reversal_ref:['Corrected cancellation','Annulation corrigée','Kolongola ebongisami','Ubatilishaji uliosahihishwa'],
 created_at:['Recorded on','Enregistrée le','Ekomami na','Tarehe ya kurekodi'], source:['Channel','Canal','Nzela','Njia'],
} as const;
export function expenseText(locale:WenzeLocale,key:keyof typeof copy){return copy[key][['en','fr','ln','sw'].indexOf(locale)];}
