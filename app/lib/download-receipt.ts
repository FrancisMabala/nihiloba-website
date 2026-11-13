export function downloadReceipt(file:File){
 const url=URL.createObjectURL(file);
 const link=document.createElement("a");
 link.href=url;
 link.download=file.name;
 link.click();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
