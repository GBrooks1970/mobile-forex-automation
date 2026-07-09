import { describe, expect, it } from 'vitest';
import { Portfolio } from '../../src/app/portfolio.js';

const USER = 'demo-abc12345';

describe('Portfolio.open', () => {
  it('opens a position at the entry price with a deterministic id', () => {
    const p = new Portfolio(USER, 1_000_000);
    const r1 = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 50 }, 125_000, 1);
    const r2 = p.open({ currencyPair: 'EUR/USD', tradeDirection: 'SELL', volumeLots2: 10 }, 108_000, 2);
    expect(r1.ok && r1.trade.tradeId).toBe(`${USER}-t0001`);
    expect(r2.ok && r2.trade.tradeId).toBe(`${USER}-t0002`);
    expect(p.openPositions()).toHaveLength(2);
  });

  it('does not touch the cash balance on open (paper trading, no margin)', () => {
    const p = new Portfolio(USER, 1_000_000);
    p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 50 }, 125_000, 1);
    expect(p.balancePence()).toBe(1_000_000);
  });

  it('rejects an invalid order (zero volume) without creating a position', () => {
    const p = new Portfolio(USER, 1_000_000);
    const r = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 0 }, 125_000, 1);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.violations.map((v) => v.rule)).toContain('volume-positive');
    expect(p.openPositions()).toHaveLength(0);
  });
});

describe('Portfolio floating P&L (matches the PRS oracle)', () => {
  it('a BUY at 1.25000 marked to 1.25620 floats +£246.78 (the worked example)', () => {
    const p = new Portfolio(USER, 1_000_000);
    const r = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 50 }, 125_000, 1);
    const id = r.ok ? r.trade.tradeId : '';
    p.markPrice(id, 125_620);
    expect(p.floatingPnlPence(id, 125_620)).toBe(24_678);
  });

  it('floating P&L is zero at entry and flips sign with direction', () => {
    const p = new Portfolio(USER, 1_000_000);
    const buy = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 50 }, 125_000, 1);
    const sell = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'SELL', volumeLots2: 50 }, 125_000, 2);
    const buyId = buy.ok ? buy.trade.tradeId : '';
    const sellId = sell.ok ? sell.trade.tradeId : '';
    expect(p.floatingPnlPence(buyId, 125_000)).toBe(0);
    p.markPrice(buyId, 125_620);
    p.markPrice(sellId, 125_620);
    expect(p.floatingPnlPence(buyId, 125_620)).toBe(24_678);
    expect(p.floatingPnlPence(sellId, 125_620)).toBe(-24_678);
  });
});

describe('Portfolio equity', () => {
  it('equity = balance + total floating P&L across positions', () => {
    const p = new Portfolio(USER, 1_000_000);
    const r = p.open({ currencyPair: 'GBP/USD', tradeDirection: 'BUY', volumeLots2: 50 }, 125_000, 1);
    const id = r.ok ? r.trade.tradeId : '';
    p.markPrice(id, 125_620);
    const rate = () => 125_620;
    expect(p.totalFloatingPnlPence(rate)).toBe(24_678);
    expect(p.equityPence(rate)).toBe(1_000_000 + 24_678);
  });
});
