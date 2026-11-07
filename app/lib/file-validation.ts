type Locale='en'|'fr'|'ln'|'sw';
const copy={
 en:{size:(n:number)=>`The file is too large (maximum ${n} MB).`,type:(s:string)=>`Unsupported format. Use ${s}.`},
 fr:{size:(n:number)=>`Le fichier est trop volumineux (maximum ${n} Mo).`,type:(s:string)=>`Format non accepté. Utilisez ${s}.`},
 ln:{size:(n:number)=>`Fichier eleki monene (mingi ${n} Mo).`,type:(s:string)=>`Lolenge ya fichier endimami te. Salelá ${s}.`},
 sw:{size:(n:number)=>`Faili ni kubwa sana (kiwango cha juu ${n} MB).`,type:(s:string)=>`Muundo haukubaliwi. Tumia ${s}.`},
};
/** Presentation only; each caller retains its existing limits and server validation. */
export function fileValidation(file:Pick<File,'size'|'type'>,locale:Locale,maxMB:number,types:readonly string[],formats:string){
 if(file.size>maxMB*1024*1024)return copy[locale].size(maxMB);
 if(!types.includes(file.type))return copy[locale].type(formats);
 return '';
}
