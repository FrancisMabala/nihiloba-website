"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import './job-mobile-detail.css';

/** Move the one real action, rather than rendering a second actionable copy. */
export function JobMobileApplication({children}:{children:ReactNode}){
 const anchor=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null);
 const [position,setPosition]=useState({fixed:false,bottom:0,height:0});
 useEffect(()=>{let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  const el=anchor.current,body=content.current;if(!el||!body)return;
  const viewport=window.visualViewport,nav=document.querySelector<HTMLElement>('.shida-navigation'),navBox=nav?.getBoundingClientRect();
  const usableBottom=Math.min(viewport?viewport.offsetTop+viewport.height:innerHeight,navBox&&navBox.height>0?navBox.top:innerHeight);
  const rect=el.getBoundingClientRect(),keyboard=!!viewport&&innerHeight-viewport.height>150;
  const expanded=!!body.querySelector('input,textarea,form')||body.offsetHeight>180;
  const fixed=!expanded&&matchMedia('(max-width:760px)').matches&&!keyboard&&(rect.top>=usableBottom||rect.bottom<=0);
  setPosition(old=>{const next={fixed,bottom:innerHeight-usableBottom,height:fixed?old.height||body.offsetHeight:body.offsetHeight};return old.fixed===next.fixed&&old.bottom===next.bottom&&old.height===next.height?old:next;});
 });};
 const resize=new ResizeObserver(update);if(anchor.current)resize.observe(anchor.current);if(content.current)resize.observe(content.current);
 window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);update();
 return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',update);window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);window.visualViewport?.removeEventListener('scroll',update);};
 },[]);
 function reveal(){if(!position.fixed)return;setPosition(old=>({...old,fixed:false}));requestAnimationFrame(()=>anchor.current?.scrollIntoView({block:'center'}));}
 return <div ref={anchor} className="job-application-anchor" style={position.fixed?{minHeight:position.height}:undefined}><div ref={content} className={position.fixed?'job-mobile-application is-fixed':'job-mobile-application'} style={position.fixed?{bottom:position.bottom}:undefined} onClickCapture={reveal}>{children}</div></div>;
}
