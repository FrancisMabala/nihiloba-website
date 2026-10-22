"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
import {posText} from "@/app/lib/wenze-pos-copy";
import {cameraCopy} from "@/app/lib/wenze-camera-copy";
import {wenzeScanCode} from "@/app/lib/wenze-scan-code";

type Detector={detect:(video:HTMLVideoElement)=>Promise<{rawValue:string}[]>};
type DetectorClass={new(options:{formats:string[]}):Detector;getSupportedFormats?:()=>Promise<string[]>};
export function WenzeCamera({onCode,locale}:{onCode:(value:string)=>void;locale:WenzeLocale}){
 const t=cameraCopy[locale],video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null);
 const controls=useRef<{stop:()=>void}|null>(null),generation=useRef(0),frame=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [open,setOpen]=useState(false),[message,setMessage]=useState("");
 const cleanup=useCallback(()=>{++generation.current;cancelAnimationFrame(frame.current);if(timer.current)clearTimeout(timer.current);controls.current?.stop();controls.current=null;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null;},[]);
 const stop=useCallback(()=>{cleanup();setOpen(false);},[cleanup]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};const leave=()=>stop();document.addEventListener("visibilitychange",hide);window.addEventListener("pagehide",leave);return()=>{cleanup();document.removeEventListener("visibilitychange",hide);window.removeEventListener("pagehide",leave);};},[cleanup,stop]);
 async function start(){
  if(open)return;
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){setMessage(t.secure);return;}
  cleanup();const version=generation.current;setOpen(true);setMessage(t.starting);
  const accept=(raw:string)=>{if(version!==generation.current)return;const code=wenzeScanCode(raw);if(!code){setMessage(t.invalid);return;}stop();setMessage("");onCode(code);};
  try{
   const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
   if(version!==generation.current){acquired.getTracks().forEach(track=>track.stop());return;}
   stream.current=acquired;if(!video.current){stop();return;}video.current.srcObject=acquired;await video.current.play();
   if(version!==generation.current)return;
   setMessage(t.guide);timer.current=setTimeout(()=>{if(version===generation.current){stop();setMessage(t.timeout);}},45000);
   const fallback=async()=>{
    const [{BrowserMultiFormatReader},{BarcodeFormat,DecodeHintType}]=await Promise.all([import("@zxing/browser"),import("@zxing/library")]);
    if(version!==generation.current||!video.current)return;
    const reader=new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS,[BarcodeFormat.CODE_128,BarcodeFormat.QR_CODE]]]),{delayBetweenScanAttempts:120,delayBetweenScanSuccess:500});
    const running=await reader.decodeFromStream(acquired,video.current,result=>{if(result)accept(result.getText());});
    if(version!==generation.current)running.stop();else controls.current=running;
   };
   const Native=(window as unknown as {BarcodeDetector?:DetectorClass}).BarcodeDetector;
   let detector:Detector|null=null;
   if(Native){try{const formats=await Native.getSupportedFormats?.();if(!formats||formats.includes("code_128"))detector=new Native({formats:formats?.includes("qr_code")?["code_128","qr_code"]:["code_128"]});}catch{/* use compatible decoder */}}
   if(version!==generation.current)return;
   if(!detector){await fallback();return;}
   const tick=async()=>{if(version!==generation.current||!video.current)return;try{const codes=await detector!.detect(video.current);if(codes[0])accept(codes[0].rawValue);}catch{try{await fallback();}catch{if(version===generation.current){stop();setMessage(t.failed);}}return;}if(version===generation.current)frame.current=requestAnimationFrame(()=>void tick());};
   void tick();
  }catch(error){if(version!==generation.current)return;stop();const name=error instanceof DOMException?error.name:"";setMessage(name==="NotAllowedError"?t.denied:name==="NotFoundError"||name==="OverconstrainedError"?t.missing:t.failed);}
 }
 return <div className="wz-camera-control"><button type="button" onClick={()=>open?stop():void start()}>{posText(locale,open?"stop":"camera")}</button><video hidden={!open} ref={video} playsInline muted className="wz-camera" aria-label={t.guide}/>{message&&<p role="status">{message}</p>}</div>;
}
