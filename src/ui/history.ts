// Trade-history view (MF-07, FR-4): closed positions with their realised net
// P&L. Read-only — mirrors the immutable trade_history rows.

import { formatGbpPence, formatLots2, formatPricePts } from '../core/format.js';
import type { Portfolio } from '../app/portfolio.js';
import type { TradeHistoryRow } from '../core/types.js';

function rowHtml(row: TradeHistoryRow): string {
  const cls = row.netPnlPence > 0 ? 'pnl-up' : row.netPnlPence < 0 ? 'pnl-down' : '';
  return `
    <tr data-testid="history-${row.historyId}" data-trade-id="${row.tradeId}" data-reason="${row.closeReason}">
      <td>${row.currencyPair}</td>
      <td>${row.tradeDirection}</td>
      <td>${formatLots2(row.volumeLots2)}</td>
      <td data-testid="history-entry-${row.tradeId}">${formatPricePts(row.currencyPair, row.entryPricePts)}</td>
      <td data-testid="history-exit-${row.tradeId}">${formatPricePts(row.currencyPair, row.exitPricePts)}</td>
      <td class="pnl ${cls}" data-testid="history-pnl-${row.tradeId}">${formatGbpPence(row.netPnlPence)}</td>
    </tr>`;
}

export function renderHistory(portfolio: Portfolio): string {
  const rows = portfolio.history();
  const body =
    rows.length === 0
      ? `<tr data-testid="history-empty"><td colspan="6" class="hint">No closed trades yet</td></tr>`
      : [...rows].reverse().map(rowHtml).join(''); // newest first for display

  return `
    <section class="pane history-pane" aria-labelledby="history-heading">
      <h2 id="history-heading">Trade history</h2>
      <table class="history" data-testid="history">
        <thead><tr>
          <th scope="col">Pair</th><th scope="col">Side</th><th scope="col">Lots</th>
          <th scope="col">Entry</th><th scope="col">Exit</th><th scope="col">Net P&amp;L</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </section>`;
}
