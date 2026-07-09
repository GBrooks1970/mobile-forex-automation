import { describe, expect, it } from 'vitest';
import { Portfolio } from '../../src/app/portfolio.js';

const USER = 'demo-abc12345';

/** Open one GBP/USD BUY 0.50 lots at 1.25000 and return [portfolio, tradeId]. */
function withOpenBuy(): [Portfolio, string] {
  const p = new Portfolio(USER, 1_000_000);
  const r = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 50 }, 125_000, 1_000);
  return [p, r.ok ? r.trade.tradeId : ''];
}

describe('Portfolio.close (FR-4)', () => {
  it('closing the PRS oracle position credits net £244.28 and updates the balance', () => {
    const [p, id] = withOpenBuy();
    // exit 1.25620, R = 1.25620 (same as the worked example).
    const outcome = p.close(id, 125_620, 2_000, 125_620);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    // gross +£246.78 (24678p); commission £2.50 (250p); swap 0 (same-day) => net £244.28 (24428p).
    expect(outcome.row.grossPnlPence).toBe(24_678);
    expect(outcome.row.commissionPence).toBe(250);
    expect(outcome.row.swapPence).toBe(0);
    expect(outcome.row.netPnlPence).toBe(24_428);
    expect(outcome.row.closeReason).toBe('MANUAL');

    // Cash balance moved by exactly the net (PRS: balance updates on closure).
    expect(p.balancePence()).toBe(1_000_000 + 24_428);
  });

  it('removes the position and records exactly one immutable history row', () => {
    const [p, id] = withOpenBuy();
    expect(p.openPositions()).toHaveLength(1);
    const outcome = p.close(id, 125_620, 2_000, 125_620);
    expect(p.openPositions()).toHaveLength(0);
    expect(p.history()).toHaveLength(1);

    // Immutability: the stored row is frozen.
    if (outcome.ok) {
      expect(Object.isFrozen(outcome.row)).toBe(true);
      expect(() => {
        (outcome.row as { netPnlPence: number }).netPnlPence = 0;
      }).toThrow();
    }
  });

  it('deducts a loss from the balance', () => {
    const [p, id] = withOpenBuy();
    // Price fell to 1.24500 -> BUY loss. gross = -62.. let core decide; assert balance < start.
    p.close(id, 124_500, 2_000, 124_500);
    expect(p.balancePence()).toBeLessThan(1_000_000);
    expect(p.history()[0]?.netPnlPence).toBeLessThan(0);
  });

  it('rejects closing an unknown position', () => {
    const p = new Portfolio(USER, 1_000_000);
    const outcome = p.close('nope', 125_000, 1, 125_000);
    expect(outcome.ok).toBe(false);
    expect(outcome.ok === false && outcome.violations.map((v) => v.rule)).toContain('unknown-trade');
  });

  it('rejects a close timestamped before the open (closed_at >= opened_at)', () => {
    const [p, id] = withOpenBuy(); // opened at 1000
    const outcome = p.close(id, 125_620, 999, 125_620);
    expect(outcome.ok).toBe(false);
    expect(outcome.ok === false && outcome.violations.map((v) => v.rule)).toContain(
      'closed-after-opened',
    );
    expect(p.openPositions()).toHaveLength(1); // still open — nothing mutated
    expect(p.balancePence()).toBe(1_000_000);
  });

  it('history ids are deterministic and monotonic', () => {
    const p = new Portfolio(USER, 1_000_000);
    const a = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 10 }, 125_000, 1);
    const b = p.open({ currencyPair: 'EUR/USD', tradeDirection: 'SELL', volumeLots2: 10 }, 108_000, 2);
    if (a.ok) p.close(a.trade.tradeId, 125_100, 3, 125_100);
    if (b.ok) p.close(b.trade.tradeId, 107_900, 4, 125_100);
    expect(p.history().map((r) => r.historyId)).toEqual([`${USER}-h0001`, `${USER}-h0002`]);
  });
});
