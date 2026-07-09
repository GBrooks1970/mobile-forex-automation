// Order panel view (MF-06, FR-3): pick a pair, set a volume, place a market
// BUY or SELL. Volume is entered in lots (e.g. 0.10) and parsed to integer
// hundredths (lots2) at the edge.

import { MVP_PAIRS } from '../core/types.js';

export function renderOrderPanel(): string {
  const options = MVP_PAIRS.map((p) => `<option value="${p}">${p}</option>`).join('');
  return `
    <section class="pane order-pane" aria-labelledby="order-heading">
      <h2 id="order-heading">Place order</h2>
      <form data-testid="order-form" novalidate>
        <label>Pair
          <select name="pair" data-testid="order-pair">${options}</select>
        </label>
        <label>Volume (lots)
          <input name="volume" data-testid="order-volume" inputmode="decimal" value="0.10">
        </label>
        <div class="order-buttons">
          <button type="submit" name="direction" value="SELL" data-testid="order-sell" class="sell">Sell</button>
          <button type="submit" name="direction" value="BUY" data-testid="order-buy" class="buy">Buy</button>
        </div>
        <div class="form-errors" data-testid="order-errors" role="alert"></div>
      </form>
    </section>`;
}

/** Parse a lots string ("0.10", "1", "0.05") to integer hundredths, or null. */
export function parseLots2(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, frac = ''] = trimmed.split('.');
  const lots2 = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isInteger(lots2) ? lots2 : null;
}
