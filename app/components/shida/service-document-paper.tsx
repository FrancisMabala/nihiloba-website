"use client";
import {useRef,useState} from 'react';
import {docWords,lineAmount,money,type Paper} from '../../lib/service-document';
import type {ProviderLocale} from '../../lib/services-provider-copy';
import './service-document.css';

const width=595,height=842,margin=40;
const accents:Record<string,string>={green:'#24533f',blue:'#375c7a',plum:'#684664',slate:'#465660'};
type Mark={x:number;y:number;text:string;size:number;bold?:boolean;right?:boolean;serif?:boolean;color?:string;box?:{w:number;h:number}};
function pages(paper:Paper,locale:ProviderLocale){
 const t=docWords(locale),accent=accents[paper.accent||'green']||accents.green;
 const result:Mark[][]=[[]];let y=48;
 const current=()=>result[result.length-1];
 const context=typeof document==='undefined'?null:document.createElement('canvas').getContext('2d');
 function fit(value:string,maxWidth:number,limit:number,size:number,bold:boolean,serif:boolean){
  let end=Math.min(limit,value.length);
  if(context){
   context.font=(bold?'bold ':'')+size+'px '+(serif?'Georgia,serif':'Arial,sans-serif');
   while(end>1&&context.measureText(value.slice(0,end)).width>maxWidth)end--;
  }
  if(end<value.length){const space=value.lastIndexOf(' ',end);if(space>0)end=space;}
  return end;
 }
 function band(top:number,h:number,color:string){current().push({x:margin,y:top,size:0,text:'',color,box:{w:width-2*margin,h}});}

 const room=(space:number)=>{if(y+space>780){result.push([]);y=48;}};
 function add(text:string,size=12,bold=false,serif=false,color='#202921',x=margin,right=false){current().push({text,x,y,size,bold,serif,color,right});}
 function paragraph(value:string|undefined,size=12,bold=false,serif=false,color='#202921',limit=78){
  if(!value)return;
  for(const line of value.split(/\r?\n/)){
   // A conservative character width also keeps unbroken tokens inside the paper.
   let rest=line;do{const n=fit(rest,width-2*margin,limit,size,bold,serif);
    room(size+7);add(rest.slice(0,n),size,bold,serif,color);y+=size+7;rest=rest.slice(n).trimStart();
   }while(rest);
  }y+=4;
 }
 paragraph(paper.issuer,22,true,true,accent,39);band(y-10,1.2,accent);y+=12;paragraph(t[paper.kind],30,true,true,accent,27);
 paragraph([paper.state,paper.reference,paper.date].filter(Boolean).join(' · '));paragraph(t.client+' · '+paper.client);
 const d=paper.document;
 for(const key of ['subject','description','included','excluded'] as const){if(d[key]){paragraph(t[key],12,true);paragraph(d[key]);}}
 const head=()=>{room(30);band(y-14,21,'#eef1e9');add(t.label,10,true);add(t.qty,10,true,false,accent,319,true);add(t.unit,10,true,false,accent,432,true);add(t.amount,10,true,false,accent,555,true);y+=22;};
 if(d.items?.length){head();for(const item of d.items){
   const chunks:string[]=[];let label=item.label;do{const len=fit(label,223,42,11,false,false);chunks.push(label.slice(0,len));label=label.slice(len).trimStart();}while(label);if(y+chunks.length*18>775){result.push([]);y=48;head();}
   add(String(item.quantity),11,false,false,'#202921',319,true);add(money(item.unit_price,locale),11,false,false,'#202921',432,true);add(money(lineAmount(item),locale),11,false,false,'#202921',555,true);
   for(const chunk of chunks){add(chunk,11);y+=18;}band(y-10,.6,'#d5d8d2');y+=5;
 }}
 room(45);band(y-18,27,'#e7ede3');add(t.total,18,true,true,accent);add(money(paper.amount,locale)+' '+paper.currency,19,true,true,accent,555,true);y+=36;
 for(const key of ['timing','conditions','instructions'] as const)if(d[key]){paragraph(t[key],12,true);paragraph(d[key]);}
 result.forEach((page,i)=>{page.push({x:40,y:789,size:0,text:'',color:accent,box:{w:515,h:.6}},{x:40,y:810,text:'SHIDA by NIHILOBA',size:10},{x:555,y:810,text:(i+1)+' / '+result.length,size:10,right:true});});return result;
}
function downloadPdf(sheets:Mark[][],filename:string){
 // Rasterize the same positioned glyphs as the A4 preview, including non-Latin names.
 const objects:BlobPart[][]=[];const encoder=new TextEncoder();const enc=(s:string)=>encoder.encode(s);
 const put=(parts:BlobPart[])=>{objects.push(parts);return objects.length;};
 put(['<< /Type /Catalog /Pages 2 0 R >>']);put(['<< /Type /Pages /Count '+sheets.length+' /Kids ['+sheets.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>']);
 sheets.forEach((marks,i)=>{
  const canvas=document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;const c=canvas.getContext('2d');if(!c)throw Error();
  c.scale(2,2);c.fillStyle='white';c.fillRect(0,0,width,height);
  for(const m of marks){if(m.box){c.fillStyle=m.color||'#fff';c.fillRect(m.x,m.y,m.box.w,m.box.h);continue;}c.font=(m.bold?'bold ':'')+m.size+'px '+(m.serif?'Georgia,serif':'Arial,sans-serif');c.fillStyle=m.color||'#202921';c.textAlign=m.right?'right':'left';c.fillText(m.text,m.x,m.y);}
  const jpeg=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.95).split(',')[1]),ch=>ch.charCodeAt(0));canvas.width=0;
  const ref=3+3*i;put(['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /PageImage '+(ref+1)+' 0 R >> >> /Contents '+(ref+2)+' 0 R >>']);
  put(['<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.byteLength+' >>\nstream\n',jpeg.buffer,'\nendstream']);
  const commands='q 595 0 0 842 0 0 cm /PageImage Do Q';put(['<< /Length '+commands.length+' >>\nstream\n'+commands+'\nendstream']);
 });
 const parts:BlobPart[]=['%PDF-1.4\n'];const offsets=[0];let offset=9;
 objects.forEach((obj,i)=>{offsets.push(offset);for(const part of [(i+1)+' 0 obj\n',...obj,'\nendobj\n']){parts.push(part);offset+=typeof part==='string'?enc(part).length:(part as ArrayBuffer).byteLength;}});
 const xref=offset;parts.push('xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
 const url=URL.createObjectURL(new Blob(parts,{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=filename+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function DocumentPaper({paper,locale}:{paper:Paper;locale:ProviderLocale}){
 const t=docWords(locale),sheets=pages(paper,locale),dialog=useRef<HTMLDialogElement>(null),[printing,setPrinting]=useState(false);
 function draw(){return sheets.map((marks,i)=><svg key={i} viewBox="0 0 595 842" className="svc-document-page" role="img" aria-label={marks.map(m=>m.text).join(' ')}>{marks.map((m,n)=>m.box?<rect key={n} x={m.x} y={m.y} width={m.box.w} height={m.box.h} fill={m.color}/>:<text key={n} x={m.x} y={m.y} fontFamily={m.serif?'Georgia,serif':'Arial,sans-serif'} fontSize={m.size} fontWeight={m.bold?'bold':'normal'} fill={m.color||'#202921'} textAnchor={m.right?'end':'start'}>{m.text}</text>)}</svg>);}
 function print(){setPrinting(true);requestAnimationFrame(()=>requestAnimationFrame(()=>{window.print();setPrinting(false);}));}
 return <section className={'svc-document-paper'+(printing?' is-printing':'')}><header><strong>{t.preview} A4</strong><button type="button" onClick={()=>dialog.current?.showModal()}>{t.expand}</button><button type="button" onClick={()=>downloadPdf(sheets,paper.reference||t[paper.kind])}>{t.download}</button><button type="button" onClick={print}>{t.print}</button></header><div className="svc-document-pages">{draw()}</div><dialog ref={dialog}><button type="button" aria-label={{en:'Close',fr:'Fermer',ln:'Kanga',sw:'Funga'}[locale]} onClick={()=>dialog.current?.close()}>×</button>{draw()}</dialog></section>;
}
