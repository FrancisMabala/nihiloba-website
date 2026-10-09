import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FoodTerms } from '../app/components/shida/restaurant-receipt';
import type { Terms } from '../app/lib/restaurant-work';

describe('protected Restaurant order terms', () => {
  it('shows the food preference and keeps private delivery instructions out of receipts', () => {
    const terms = {currency:'CDF', food_subtotal:'1000.00', delivery_fee:null,
      order_total:'1000.00', standalone:[], plates:[],
      food_preference:'Sans piment', delivery_instruction:'Secret entrance'} as Terms;
    const html = renderToStaticMarkup(<FoodTerms terms={terms} locale="fr" />);
    expect(html).toContain('Sans piment');
    expect(html).toContain('Préférence de préparation');
    expect(html).not.toContain('Secret entrance');
  });
});
