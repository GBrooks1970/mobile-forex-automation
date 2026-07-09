// Watchlist view (MF-05, FR-2): the 5 MVP pairs with price + tick-direction
// flash. Rows carry data-seq / data-direction so a deterministic E2E can
// replay the seeded feed and assert the EXACT price at any observed seq.

import type { Feed, Tick } from '../core/feed.js';
import { formatPricePts } from '../core/format.js';
import { MVP_PAIRS, type CurrencyPair } from '../core/types.js';

export function renderWatchlist(feed: Feed): string {
  const rows = MVP_PAIRS.map((pair) => {
    const price = formatPricePts(pair, feed.currentPricePts(pair));
    return `
      <tr data-testid="watch-row-${pair}" data-pair="${pair}" data-seq="0" data-direction="flat">
        <th scope="row" class="pair-name">${pair}</th>
        <td class="pair-price" data-testid="watch-price-${pair}">${price}</td>
      </tr>`;
  }).join('');

  return `
    <section class="pane watchlist-pane" aria-labelledby="watchlist-heading">
      <h2 id="watchlist-heading">Watchlist</h2>
      <table class="watchlist" data-testid="watchlist">
        <thead><tr><th scope="col">Pair</th><th scope="col">Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

/** Apply one round of ticks to the rendered rows (called by the ticker). */
export function applyTicks(root: ParentNode, ticks: readonly Tick[]): void {
  for (const tick of ticks) {
    const row = root.querySelector<HTMLElement>(`[data-testid="watch-row-${tick.pair}"]`);
    if (!row) continue;
    row.dataset['seq'] = String(tick.seq);
    row.dataset['direction'] = tick.direction;
    row.classList.remove('tick-up', 'tick-down');
    if (tick.direction === 'up') row.classList.add('tick-up');
    if (tick.direction === 'down') row.classList.add('tick-down');
    const cell = row.querySelector<HTMLElement>(`[data-testid="watch-price-${tick.pair}"]`);
    if (cell) cell.textContent = formatPricePts(tick.pair, tick.pricePts);
  }
}

export function watchRowTestId(pair: CurrencyPair): string {
  return `watch-row-${pair}`;
}
