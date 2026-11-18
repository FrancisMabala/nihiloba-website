"use client";
import {Component,createContext,Suspense,useContext,useRef,useState,useEffect,type ComponentType,type ComponentProps,type ReactNode} from 'react';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';
import {createRestaurantPanelLoader,RestaurantPanelDownloadError,type RestaurantPanelComponent} from '../../lib/restaurant-panel-loader';
import {restaurantPanelRecoveryCopy} from '../../lib/restaurant-panel-recovery-copy';
import {restaurantText} from '../../lib/restaurant-seller-copy';
import {leaveWork} from '../../lib/restaurant-work';
import './restaurant-panel-recovery.css';

type Recovery={locale:RestaurantLocale;scope:string;onBack:()=>void;backLabel?:string};
export const RestaurantPanelRecoveryContext=createContext<Recovery|null>(null);

class DownloadBoundary extends Component<{children:ReactNode;fallback:ReactNode},{error:unknown}> {
 state:{error:unknown}={error:null};
 static getDerivedStateFromError(error:unknown){return {error};}
 render(){
  if(this.state.error){
   if(!(this.state.error instanceof RestaurantPanelDownloadError))throw this.state.error;
   return this.props.fallback;
  }
  return this.props.children;
 }
}

function RecoveryNotice({context,onRetry,attempts}:{context:Recovery;onRetry:()=>void;attempts:number}){
 const copy=restaurantPanelRecoveryCopy[context.locale],notice=useRef<HTMLDivElement>(null);
 const mounted=useRef(true),[leaving,setLeaving]=useState(false);
 useEffect(()=>{mounted.current=true;notice.current?.focus();return()=>{mounted.current=false;};},[]);
 async function reload(){
  if(leaving)return;
  setLeaving(true);
  // Deliberately no preserved scope: a document reload also loses a hidden
  // counter/editor draft. Cancelling leaves every mounted panel untouched.
  const allowed=await leaveWork();
  if(!mounted.current)return;
  if(allowed)window.location.reload();else setLeaving(false);
 }
 return <div ref={notice} tabIndex={-1} role="alert" className="rst-card rst-panel-recovery">
  <h2>{copy.title}</h2><p>{copy.help}</p>
  <div className="rst-actions">
   <button type="button" className="button button-primary" disabled={leaving} onClick={onRetry}>{copy.retry}</button>
   <button type="button" className="button button-secondary" disabled={leaving} onClick={context.onBack}>{context.backLabel??copy.back}</button>
  </div>
  {attempts>0&&<><p>{copy.reloadHelp}</p><button type="button" className="button button-secondary" disabled={leaving} onClick={()=>void reload()}>{copy.reload}</button></>}
 </div>;
}

/** Define once at module scope, just like React.lazy. Each panel owns its boundary
 * so an unavailable sibling cannot unmount the counter or shared editor. */
export function deferredRestaurantPanel<T extends RestaurantPanelComponent>(load:()=>Promise<{default:T}>) {
 const loader=createRestaurantPanelLoader(load);
 return function DeferredRestaurantPanel(props:ComponentProps<T>){
  const context=useContext(RestaurantPanelRecoveryContext);
  const [state,setState]=useState(()=>({attempt:loader.current(),retries:0}));
  const Panel=state.attempt.Component as ComponentType<ComponentProps<T>>;
  if(!context)throw new Error('Restaurant panel recovery context is required');
  return <DownloadBoundary key={`${context.scope}:${state.retries}`} fallback={<RecoveryNotice context={context} attempts={state.retries} onRetry={()=>setState(current=>({attempt:loader.retry(current.attempt),retries:current.retries+1}))}/> }>
   <Suspense fallback={<p className="rst-panel-loading" role="status">{restaurantText(context.locale,'loading')}</p>}><Panel {...props}/></Suspense>
  </DownloadBoundary>;
 };
}
