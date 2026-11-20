import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import type {ReactElement} from 'react';
const state=vi.hoisted(()=>({ref:0,video:null as unknown as HTMLVideoElement,native:vi.fn(),detect:vi.fn(),fallback:vi.fn(),hints:vi.fn(),stop:vi.fn(),track:vi.fn()}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useRef:(initial:unknown)=>({current:state.ref++===0?state.video:initial}),useState:(initial:unknown)=>[initial,vi.fn()],useCallback:(fn:unknown)=>fn,useEffect:()=>{}}));
vi.mock('@zxing/browser',()=>({BrowserMultiFormatReader:class{constructor(hints:unknown){state.hints(hints);}decodeFromStream(...args:unknown[]){return state.fallback(...args);}}}));
vi.mock('@zxing/library',()=>({BarcodeFormat:{CODE_128:'code128',QR_CODE:'qr'},DecodeHintType:{POSSIBLE_FORMATS:'formats'}}));
import {WenzeCamera} from '../app/components/shida/wenze-camera';
beforeEach(()=>{
 vi.useFakeTimers();state.ref=0;state.native.mockReset();state.detect.mockReset().mockResolvedValue([]);state.fallback.mockReset().mockResolvedValue({stop:state.stop});state.hints.mockReset();state.stop.mockReset();state.track.mockReset();
 state.video={srcObject:null,play:vi.fn().mockResolvedValue(undefined)} as unknown as HTMLVideoElement;
 vi.stubGlobal('navigator',{mediaDevices:{getUserMedia:vi.fn().mockResolvedValue({getTracks:()=>[{stop:state.track}]})}});vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
function native(formats:string[]|undefined,throws=false){class Native{static getSupportedFormats=formats?async()=>formats:undefined;constructor(options:unknown){state.native(options);if(throws)throw Error('unsupported');}detect=state.detect;}vi.stubGlobal('window',{isSecureContext:true,BarcodeDetector:Native});}
async function start(requiredFormats?:('code_128'|'qr_code')[]){
 const onCode=vi.fn();const props={locale:'en' as const,onCode,requiredFormats,parseCode:(value:string)=>value.startsWith('SHIDA-ID:')?value:null};
 const tree=WenzeCamera(props) as ReactElement<{children:ReactElement<{onClick:()=>void}>[]}>;tree.props.children[0].props.onClick();await vi.waitFor(()=>expect(state.native.mock.calls.length+state.fallback.mock.calls.length).toBeGreaterThan(0));return onCode;
}
it('uses the QR fallback when native detection supports only product barcodes',async()=>{
 native(['code_128']);await start(['qr_code']);expect(state.native).not.toHaveBeenCalled();expect(state.fallback).toHaveBeenCalledTimes(1);expect((state.hints.mock.calls[0][0] as Map<string,string[]>).get('formats')).toEqual(['qr']);
});
it('uses native QR support even if code128 is unavailable and stops after one result',async()=>{
 native(['qr_code']);state.detect.mockResolvedValue([{rawValue:'SHIDA-ID:1234567890'}]);const onCode=await start(['qr_code']);await vi.waitFor(()=>expect(onCode).toHaveBeenCalledWith('SHIDA-ID:1234567890'));expect(state.native).toHaveBeenCalledWith({formats:['qr_code']});expect(state.fallback).not.toHaveBeenCalled();expect(state.track).toHaveBeenCalledTimes(1);
});
it('does not assume QR support when native supported formats are unknown',async()=>{
 native(undefined);await start(['qr_code']);expect(state.native).not.toHaveBeenCalled();expect(state.fallback).toHaveBeenCalledTimes(1);
});
it('preserves native code128-only product scanning by default',async()=>{
 native(['code_128']);await start();expect(state.native).toHaveBeenCalledWith({formats:['code_128']});expect(state.fallback).not.toHaveBeenCalled();
});
it('preserves both available native formats for default product scanning',async()=>{
 native(['code_128','qr_code']);await start();expect(state.native).toHaveBeenCalledWith({formats:['code_128','qr_code']});expect(state.fallback).not.toHaveBeenCalled();
});
it('preserves the default decoder fallback formats',async()=>{
 native([],true);await start();expect((state.hints.mock.calls[0][0] as Map<string,string[]>).get('formats')).toEqual(['code128','qr']);
});
it('decodes QR through fallback when the native constructor rejects its advertised format',async()=>{
 native(['qr_code'],true);state.fallback.mockImplementation(async(_stream:unknown,_video:unknown,callback:(result:{getText:()=>string})=>void)=>{callback({getText:()=> 'SHIDA-ID:1234567890'});return {stop:state.stop};});const onCode=await start(['qr_code']);await vi.waitFor(()=>expect(onCode).toHaveBeenCalledTimes(1));expect(state.track).toHaveBeenCalledTimes(1);expect(state.stop).toHaveBeenCalledTimes(1);
});
it('falls back after a native decode failure with the same required QR format',async()=>{
 native(['qr_code']);state.detect.mockRejectedValue(Error('native decoder failed'));await start(['qr_code']);await vi.waitFor(()=>expect(state.fallback).toHaveBeenCalledTimes(1));expect((state.hints.mock.calls[0][0] as Map<string,string[]>).get('formats')).toEqual(['qr']);
});
