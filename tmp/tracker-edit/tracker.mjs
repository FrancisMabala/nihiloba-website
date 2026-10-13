import {FileBlob, SpreadsheetFile} from '@oai/artifact-tool';
import fs from 'node:fs/promises';

const source='C:/NIHILOBA/Backend/docs/evidence/restaurants_whatsapp_2026_10_12/release_validation_tracker.xlsx';
const book=await SpreadsheetFile.importXlsx(await FileBlob.load(source));
for(let i=0;i<book.worksheets.items.length;i++){
  const sheet=book.worksheets.getItemAt(i);
  console.log('SHEET',sheet.name);
  if(sheet.name==='Automated checks') console.log('ROWS',JSON.stringify(sheet.getRange('A42:L50').values));
}
if(process.argv.includes('--edit')){
  const sheet=book.worksheets.getItem('Automated checks');
  const add=(cell,note)=>sheet.getRange(cell).values=[[(sheet.getRange(cell).values[0][0]??'')+'\n2026-10-13 workflow verification: '+note]];
  add('J43','Website production build passed; 12/12 seeded workflow browser checks passed at 360/820/1440, including canonical counter quote, handover, bill, CDF receipt and finance totals. Complete public/guest and staged sign-in remain open.');
  add('J44','Business production build and 3/3 responsive management browser checks passed; 40 focused unit tests passed. Complete Business Restaurant browser scope remains open.');
  add('J49','Local Website, Backend and Business seller workflow correction. Counter handover now links one canonical closed bill; existing payment methods, receipt, replay, stock and money ledger apply. Daily report now separates linked order value, recorded collections, outstanding, expenses and cash variance by CDF/USD. Disposable PostgreSQL gate: 466 passed, four documented skips before final contract additions; focused post-change SQLite tests pass. Authenticated deployed capability is unverified (HTTP 401 without session). Final full SQLite gate, human FR/LN/SW review, physical devices and staging remain open. No deploy, commit or push.');
  book.recalculate();
  console.log('VERIFY',JSON.stringify(sheet.getRange('J43:J49').values));
  const output=await SpreadsheetFile.exportXlsx(book);
  await output.save('C:/NIHILOBA/nihiloba-website/tmp/tracker-edit/release_validation_tracker.xlsx');
}
if(process.argv.includes('--render')){
  const preview=await book.render({sheetName:'Automated checks',range:'G42:J49',scale:1});
  await fs.writeFile('C:/NIHILOBA/nihiloba-website/tmp/tracker-edit/tracker-preview.png',new Uint8Array(await preview.arrayBuffer()));
}
if(process.argv.includes('--fit')){
  const sheet=book.worksheets.getItem('Automated checks');
  sheet.getRange('J43').format.rowHeightPx=340;
  sheet.getRange('J44').format.rowHeightPx=330;
  sheet.getRange('J49').format.rowHeightPx=540;
  const note=String(sheet.getRange('J49').values[0][0]);
  sheet.getRange('J49').values=[[note.replace('focused post-change SQLite tests pass.','focused post-change SQLite tests pass; six targeted PostgreSQL cases pass.')]];
  book.recalculate();
  const output=await SpreadsheetFile.exportXlsx(book);
  await output.save('C:/NIHILOBA/nihiloba-website/tmp/tracker-edit/release_validation_tracker.xlsx');
}
if(process.argv.includes('--render-small')){
  const preview=await book.render({sheetName:'Automated checks',range:'G43:J44',scale:1});
  await fs.writeFile('C:/NIHILOBA/nihiloba-website/tmp/tracker-edit/tracker-preview-small.png',new Uint8Array(await preview.arrayBuffer()));
}
if(process.argv.includes('--finalize')){
  const sheet=book.worksheets.getItem('Automated checks');
  const note=String(sheet.getRange('J49').values[0][0]);
  sheet.getRange('J49').values=[[note.replace('Final full SQLite gate, human FR/LN/SW review, physical devices and staging remain open.', 'Broad SQLite diagnostic: 2,809 pass, 21 documented skips, one stale test fixed and exact-rerun passed. Final-tree full rerun, human FR/LN/SW review, physical devices and staging remain open.')]];
  book.recalculate();
  const output=await SpreadsheetFile.exportXlsx(book);
  await output.save('C:/NIHILOBA/nihiloba-website/tmp/tracker-edit/release_validation_tracker.xlsx');
}
