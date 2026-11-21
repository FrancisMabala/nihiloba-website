import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {isValidElement,type ReactNode} from 'react';
import {ActivityOverview} from '../app/components/shida/activity-overview';
import type {ActivityData} from '../app/lib/use-personal-activity-data';
// Exercise focus intent across actual component effect callbacks. This does not
// replace browser checks for DOM removal, keyboard behavior or mobile scrolling.
const lifecycle=vi.hoisted(()=>({refs:[] as Array<{current:unknown}>,cursor:0,effects:[] as Array<()=>void|(()=>void)>}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:unknown)=>[initial,vi.fn()],useRef:(initial:unknown)=>lifecycle.refs[lifecycle.cursor++]??(lifecycle.refs[lifecycle.cursor-1]={current:initial}),useEffect:(effect:()=>void|(()=>void))=>lifecycle.effects.push(effect)}));
const data:ActivityData={binding:'a'.repeat(64),pending:false,failed:true,items:[],options:[],loaded:[],more:false,markets:[],business:false,overview:{listings:[],properties:[],travel:[],seeker:undefined}};
let doc:EventTarget&{body:object;documentElement:object;activeElement:object|null};
const heading={focus:vi.fn()},button={isConnected:true};
function find(node:ReactNode,tag:string):Record<string,unknown>|undefined{
 if(Array.isArray(node)){for(const child of node){const result=find(child,tag);if(result)return result;}return;}
 if(!isValidElement<{children?:ReactNode;role?:string}>(node))return;
 if(node.type===tag)return node.props as Record<string,unknown>;
 return find(node.props.children,tag);
}
function render(current:ActivityData|null){
 lifecycle.cursor=0;lifecycle.effects=[];
 const tree=ActivityOverview({locale:'fr',current,creation:null,onRetry:vi.fn()});
 if(current?.overview)(find(tree,'h2')!.ref as {current:unknown}).current=heading;
 for(const effect of lifecycle.effects.slice(1))effect();
 return tree;
}
function retry(focused=true){
 const tree=render(data),alert=tree.props.children.find((node:unknown)=>isValidElement<{role?:string}>(node)&&node.props.role==='alert');
 const click=find(alert,'button')!.onClick as (event:{currentTarget:typeof button})=>void;
 doc.activeElement=focused?button:doc.body;click({currentTarget:button});button.isConnected=false;doc.activeElement=doc.body;render(null);
}
function moveFocus(target:object){doc.activeElement=target;const event=new Event('focusin');Object.defineProperty(event,'target',{value:target});doc.dispatchEvent(event);}
beforeEach(()=>{lifecycle.refs=[];lifecycle.cursor=0;lifecycle.effects=[];heading.focus.mockReset();button.isConnected=true;doc=Object.assign(new EventTarget(),{body:{},documentElement:{},activeElement:null as object|null});vi.stubGlobal('document',doc);});
afterEach(()=>{const cleanup=lifecycle.effects[0]?.();if(cleanup)cleanup();vi.unstubAllGlobals();});
it('restores the existing heading once after a successful completed retry',()=>{
 retry();render({...data,failed:false,pending:true});expect(heading.focus).not.toHaveBeenCalled();render({...data,failed:false});expect(heading.focus).toHaveBeenCalledExactlyOnceWith({preventScroll:true});render({...data,failed:false});expect(heading.focus).toHaveBeenCalledTimes(1);
});
it('does not steal focus after the user moved elsewhere, even if focus later returns to body',()=>{
 retry();moveFocus({name:'another control'});doc.activeElement=doc.body;render({...data,failed:false});expect(heading.focus).not.toHaveBeenCalled();
});
it('does not restore on initial load or unrelated success',()=>{render({...data,failed:false});expect(heading.focus).not.toHaveBeenCalled();});
it('does not create focus intent when retry activation never focused its button',()=>{retry(false);render({...data,failed:false});expect(heading.focus).not.toHaveBeenCalled();});
it('clears the recovery intent after a failed retry',()=>{retry();render(data);render({...data,failed:false});expect(heading.focus).not.toHaveBeenCalled();});
it('clears the recovery intent when the account changes',()=>{retry();render({...data,binding:'b'.repeat(64),failed:false});render({...data,failed:false});expect(heading.focus).not.toHaveBeenCalled();});
it('does not move focus while the retry button is still present',()=>{retry();button.isConnected=true;doc.activeElement=button;render({...data,failed:false});expect(heading.focus).not.toHaveBeenCalled();});
it('removes pending focus intent on unmount',()=>{retry();const cleanup=lifecycle.effects[0]?.();if(cleanup)cleanup();render({...data,failed:false});expect(heading.focus).not.toHaveBeenCalled();});
