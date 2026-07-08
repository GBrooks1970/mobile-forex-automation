import { describe, expect, it } from 'vitest';
import {
  BASE_PRICES_PTS,
  DEFAULT_SEED,
  createFeed,
  parseSeed,
} from '../../src/core/feed.js';
import { MVP_PAIRS } from '../../src/core/types.js';

describe('createFeed — determinism (NFR-1)', () => {
  it('identical seeds produce identical tick sequences for every pair', () => {
    const a = createFeed(42);
    const b = createFeed(42);
    for (const pair of MVP_PAIRS) {
      const seqA = Array.from({ length: 50 }, () => a.nextTick(pair));
      const seqB = Array.from({ length: 50 }, () => b.nextTick(pair));
      expect(seqA).toEqual(seqB);
    }
  });

  it('different seeds diverge', () => {
    const a = createFeed(1);
    const b = createFeed(2);
    const pricesA = Array.from({ length: 20 }, () => a.nextTick('GBP/USD').pricePts);
    const pricesB = Array.from({ length: 20 }, () => b.nextTick('GBP/USD').pricePts);
    expect(pricesA).not.toEqual(pricesB);
  });

  it('per-pair streams are independent of polling order', () => {
    // Feed 1: poll GBP/USD only. Feed 2: interleave all pairs.
    const solo = createFeed(7);
    const interleaved = createFeed(7);
    const soloPrices = Array.from({ length: 10 }, () => solo.nextTick('GBP/USD').pricePts);
    const mixedPrices: number[] = [];
    for (let i = 0; i < 10; i++) {
      for (const pair of MVP_PAIRS) {
        const tick = interleaved.nextTick(pair);
        if (pair === 'GBP/USD') mixedPrices.push(tick.pricePts);
      }
    }
    expect(mixedPrices).toEqual(soloPrices);
  });
});

describe('createFeed — tick semantics', () => {
  it('starts every pair at its base price', () => {
    const feed = createFeed(99);
    for (const pair of MVP_PAIRS) {
      expect(feed.currentPricePts(pair)).toBe(BASE_PRICES_PTS[pair]);
    }
  });

  it('currentPricePts does not advance the stream', () => {
    const feed = createFeed(5);
    const before = feed.currentPricePts('EUR/USD');
    feed.currentPricePts('EUR/USD');
    feed.currentPricePts('EUR/USD');
    expect(feed.currentPricePts('EUR/USD')).toBe(before);
    expect(feed.nextTick('EUR/USD').seq).toBe(1); // first advance is seq 1
  });

  it('direction reflects the price change relative to the previous price', () => {
    const feed = createFeed(1234);
    let prev = feed.currentPricePts('AUD/USD');
    for (let i = 0; i < 200; i++) {
      const tick = feed.nextTick('AUD/USD');
      const expected = tick.pricePts > prev ? 'up' : tick.pricePts < prev ? 'down' : 'flat';
      expect(tick.direction).toBe(expected);
      prev = tick.pricePts;
    }
  });

  it('prices stay positive integers over a long walk, for every pair', () => {
    const feed = createFeed(0);
    for (const pair of MVP_PAIRS) {
      for (let i = 0; i < 2_000; i++) {
        const { pricePts } = feed.nextTick(pair);
        expect(Number.isInteger(pricePts)).toBe(true);
        expect(pricePts).toBeGreaterThan(0);
      }
    }
  });

  it('sequence numbers are per-pair and monotonic from 1', () => {
    const feed = createFeed(3);
    expect(feed.nextTick('GBP/USD').seq).toBe(1);
    expect(feed.nextTick('GBP/USD').seq).toBe(2);
    expect(feed.nextTick('USD/JPY').seq).toBe(1); // independent counter
  });

  it('rejects a non-integer seed', () => {
    expect(() => createFeed(1.5)).toThrow();
  });
});

describe('gbpQuoteRatePts (P&L conversion source)', () => {
  it('supplies the live GBP/USD price as the conversion rate', () => {
    const feed = createFeed(11);
    expect(feed.gbpQuoteRatePts('EUR/USD')).toBe(feed.currentPricePts('GBP/USD'));
    feed.nextTick('GBP/USD');
    expect(feed.gbpQuoteRatePts('GBP/USD')).toBe(feed.currentPricePts('GBP/USD'));
  });
});

describe('parseSeed (?seed= test mode)', () => {
  it('parses a valid integer', () => {
    expect(parseSeed('42')).toBe(42);
    expect(parseSeed('0')).toBe(0);
  });

  it('falls back to the default for absent or invalid values', () => {
    expect(parseSeed(null)).toBe(DEFAULT_SEED);
    expect(parseSeed(undefined)).toBe(DEFAULT_SEED);
    expect(parseSeed('')).toBe(DEFAULT_SEED);
    expect(parseSeed('abc')).toBe(DEFAULT_SEED);
    expect(parseSeed('1.5')).toBe(DEFAULT_SEED);
    expect(parseSeed('-3')).toBe(DEFAULT_SEED);
  });
});
