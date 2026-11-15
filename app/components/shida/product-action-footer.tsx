'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import './product-action-footer.css';

/** The wizard owns the mobile bottom edge until it is closed. */
export function ProductActionFooter({children}:{children:ReactNode}){
 const footer=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=footer.current!;
  const wizard=element.closest<HTMLElement>('.wp-wizard')!;
  const viewport=window.visualViewport,media=window.matchMedia('(max-width:1023px)');
  let frame=0;
  const reveal=()=>{
   if(!media.matches)return;
   const focused=document.activeElement;
   if(!(focused instanceof HTMLElement)||!wizard.contains(focused)||element.contains(focused))return;
   const rect=focused.getBoundingClientRect(),top=viewport?.offsetTop??0,bottom=element.getBoundingClientRect().top-12;
   const descriptions=(focused.getAttribute('aria-describedby')||'').split(/\s+/).map(id=>document.getElementById(id)).filter(node=>node?.getAttribute('role')==='alert');
   const last=Math.max(rect.bottom,...descriptions.map(node=>node!.getBoundingClientRect().bottom));
   if(last>bottom)window.scrollBy({top:Math.min(last-bottom,Math.max(0,rect.top-top-12)),behavior:'instant'});
   else if(rect.top<top+12)window.scrollBy({top:rect.top-top-12,behavior:'instant'});
  };
  const update=()=>{
   const inset=viewport?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
   element.style.setProperty('--product-viewport-inset',`${inset}px`);
   wizard.style.setProperty('--product-action-space',`${media.matches?element.getBoundingClientRect().height+inset:0}px`);
   cancelAnimationFrame(frame);frame=requestAnimationFrame(reveal);
  };
  const observer=new ResizeObserver(update);observer.observe(element);
  update();media.addEventListener('change',update);viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  wizard.addEventListener('focusin',update);wizard.addEventListener('invalid',update,true);window.addEventListener('resize',update);
  return()=>{observer.disconnect();cancelAnimationFrame(frame);media.removeEventListener('change',update);viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);wizard.removeEventListener('focusin',update);wizard.removeEventListener('invalid',update,true);window.removeEventListener('resize',update);wizard.style.removeProperty('--product-action-space');};
 },[]);
 return <div ref={footer} className="wp-step-actions product-action-footer">{children}</div>;
}
