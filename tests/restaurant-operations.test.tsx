import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {RestaurantToday} from '../app/components/shida/restaurant-today';
import {operationDay,operationsCopy} from '../app/lib/restaurant-operations-copy';
import {dailyRoutes,validDailyQuery} from '../app/lib/restaurant-daily-contract';
describe('restaurant overview',()=>{
 it('uses the restaurant local day and does not invent a missing zone',()=>{
  expect(operationDay('Africa/Kinshasa',new Date('2026-11-14T23:15:00Z'))).toBe('2026-11-15');
  expect(operationDay(null)).toBeNull();expect(operationDay('Invalid/Zone')).toBeNull();
 });
 it('allows only a read-only daily summary without arbitrary query fields',()=>{
  const path='RST_one/service/daily/summary';
  expect(dailyRoutes.some(([pattern,methods])=>pattern.test(path)&&methods.includes('GET'))).toBe(true);
  expect(dailyRoutes.some(([pattern,methods])=>pattern.test(path)&&methods.includes('POST'))).toBe(false);
  expect(validDailyQuery(path,'GET',new URLSearchParams('owner=other'))).toBe(false);
 });
 it.each(['fr','en','ln','sw'] as const)('keeps restricted features absent in %s',locale=>{
  const markup=renderToStaticMarkup(<RestaurantToday path="personal/restaurants/RST_one" binding="test" locale={locale} zone="Africa/Kinshasa" canPrepare canSell={false} canStock={false} canEditIntake={false} onOpen={()=>{}}/>);
  expect(markup).toContain(operationsCopy[locale].today);
  expect(markup).not.toContain('rst-ops-money');expect(markup).not.toContain(operationsCopy[locale].reservations);
  expect(markup).not.toContain('>0<');
 });
});
