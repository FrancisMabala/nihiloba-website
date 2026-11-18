import {describe,it,expect,vi} from 'vitest';
import {createRestaurantPanelLoader,isPanelAssetError,RestaurantPanelDownloadError} from '../app/lib/restaurant-panel-loader';

const missing=()=>Object.assign(new Error('Loading chunk 123 failed.'),{name:'ChunkLoadError'});
describe('Restaurant deferred panel attempts',()=>{
 it('deduplicates one attempt, caches failure, and explicitly reloads only a rejected lazy type',async()=>{
  const component=()=>null;
  const load=vi.fn().mockRejectedValueOnce(missing()).mockResolvedValue({default:component});
  const resource=createRestaurantPanelLoader(load),first=resource.current();
  const one=first.load(),two=first.load();expect(one).toBe(two);
  await expect(one).rejects.toBeInstanceOf(RestaurantPanelDownloadError);
  await expect(resource.current().load()).rejects.toBeInstanceOf(RestaurantPanelDownloadError);
  expect(load).toHaveBeenCalledTimes(1);
  const retry=resource.retry(first);expect(retry.Component).not.toBe(first.Component);
  expect(resource.retry(first)).toBe(retry);
  await expect(retry.load()).resolves.toEqual({default:component});
  expect(resource.retry(retry)).toBe(retry);
  expect(resource.current().Component).toBe(retry.Component);
  await retry.load();expect(load).toHaveBeenCalledTimes(2);
 });
 it('does not retry another successful panel or change its identity',async()=>{
  const good=createRestaurantPanelLoader(vi.fn().mockResolvedValue({default:()=>null}));
  const bad=createRestaurantPanelLoader(vi.fn().mockRejectedValue(missing()));
  const loaded=good.current();await loaded.load();
  await expect(bad.current().load()).rejects.toBeInstanceOf(RestaurantPanelDownloadError);
  bad.retry(bad.current());expect(good.current()).toBe(loaded);
 });
 it.each([new TypeError('Broken module evaluation'),new Error('Render bug'),new Error('fetch failed')])('propagates unrelated errors without relabeling or retrying them',async error=>{
  const resource=createRestaurantPanelLoader(()=>Promise.reject(error));
  const first=resource.current();await expect(first.load()).rejects.toBe(error);
  expect(first.failed).toBe(false);expect(resource.retry(first)).toBe(first);
 });
 it.each([
  missing(),
  Object.assign(new Error('Loading CSS chunk 23 failed'),{code:'CSS_CHUNK_LOAD_FAILED'}),
  new Error('Failed to load chunk /_next/static/chunks/example.js from module [project]/panel'),
 ])('recognizes the supported asset errors',error=>expect(isPanelAssetError(error)).toBe(true));
 it.each([undefined,null,'Loading chunk failed',new Error('Bad application data'),new TypeError('Failed to fetch')])('does not classify arbitrary failures as asset downloads',error=>expect(isPanelAssetError(error)).toBe(false));
});
