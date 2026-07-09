// Open-positions view (MF-06): one row per open trade with entry, live price,
// and floating (unrealised) P&L. Rows carry data-* so the E2E can replay the
// seeded feed and predict the exact floating P&L at any observed price.

import type { Feed } from '../core/feed.js';
import { formatGbpPence, formatLots2, formatPricePts } from '../core/format.js';
import type { Portfolio } from '../app/portfolio.js';
import type { OpenTrade } from '../core/types.js';

function rowHtml(trade: OpenTrade, floatingPence: number): string {
  const pnlClass = floatingPence > 0 ? 'pnl-up' : floatingPence < 0 ? 'pnl-down' : '';
  return `
    <tr data-testid="position-${trade.tradeId}" data-trade-id="${trade.tradeId}"
        data-pair="${trade.currencyPair}" data-direction="${trade.tradeDirection}">
      <td>${trade.currencyPair}</td>
      <td>${trade.tradeDirection}</td>
      <td>${formatLots2(trade.volumeLots2)}</td>
      <td data-testid="position-entry-${trade.tradeId}">${formatPricePts(trade.currencyPair, trade.entryPricePts)}</td>
      <td data-testid="position-price-${trade.tradeId}">${formatPricePts(trade.currencyPair, trade.currentPricePts)}</td>
      <td class="pnl ${pnlClass}" data-testid="position-pnl-${trade.tradeId}">${formatGbpPence(floatingPence)}</td>
      <td><button type="button" class="close-btn" data-testid="position-close-${trade.tradeId}" data-close="${trade.tradeId}">Close</button></td>
    </tr>`;
}

export function renderPositions(portfolio: Portfolio, feed: Feed): string {
  const positions = portfolio.openPositions();
  const body =
    positions.length === 0
      ? `<tr data-testid="positions-empty"><td colspan="7" class="hint">No open positions</td></tr>`
      : positions
          .map((t) => rowHtml(t, portfolio.floatingPnlPence(t.tradeId, feed.gbpQuoteRatePts(t.currencyPair))))
          .join('');

  return `
    <section class="pane positions-pane" aria-labelledby="positions-heading">
      <h2 id="positions-heading">Open positions</h2>
      <table class="positions" data-testid="positions">
        <thead><tr>
          <th scope="col">Pair</th><th scope="col">Side</th><th scope="col">Lots</th>
          <th scope="col">Entry</th><th scope="col">Price</th><th scope="col">P&amp;L</th><th scope="col"></th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </section>`;
}

/** Re-price and re-render the floating P&L of every open position (on tick). */
export function updatePositions(root: ParentNode, portfolio: Portfolio, feed: Feed): void {
  for (const trade of portfolio.openPositions()) {
    portfolio.markPrice(trade.tradeId, feed.currentPricePts(trade.currencyPair));
    const priceCell = root.querySelector<HTMLElement>(`[data-testid="position-price-${trade.tradeId}"]`);
    if (priceCell) priceCell.textContent = formatPricePts(trade.currencyPair, trade.currentPricePts);
    const pnl = portfolio.floatingPnlPence(trade.tradeId, feed.gbpQuoteRatePts(trade.currencyPair));
    const pnlCell = root.querySelector<HTMLElement>(`[data-testid="position-pnl-${trade.tradeId}"]`);
    if (pnlCell) {
      pnlCell.textContent = formatGbpPence(pnl);
      pnlCell.classList.remove('pnl-up', 'pnl-down');
      if (pnl > 0) pnlCell.classList.add('pnl-up');
      if (pnl < 0) pnlCell.classList.add('pnl-down');
    }
  }
}
