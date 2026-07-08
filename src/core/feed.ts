// Deterministic seeded mock price feed (MF-03). Pure — no timers, no I/O:
// the UI layer decides WHEN ticks happen; this module decides only WHAT the
// next price is. Identical seed => identical tick sequence, forever (NFR-1).
//
// Each pair gets its own independent PRNG stream derived from (seed, pair),
// so the order in which pairs are polled cannot cross-contaminate sequences —
// an E2E that only watches GBP/USD sees the same prices regardless of what
// the watchlist does with the other pairs.

import { MVP_PAIRS, type CurrencyPair, isJpyQuoted } from './types.js';

export type TickDirection = 'up' | 'down' | 'flat';

export interface Tick {
  pair: CurrencyPair;
  /** integer points (see types.ts) */
  pricePts: number;
  /** relative to the previous price of the SAME pair */
  direction: TickDirection;
  /** per-pair sequence number, starting at 1 for the first tick */
  seq: number;
}

/** Realistic-looking base prices, integer points. */
export const BASE_PRICES_PTS: Readonly<Record<CurrencyPair, number>> = {
  'GBP/USD': 125_000, // 1.25000
  'EUR/USD': 108_000, // 1.08000
  'USD/JPY': 155_000, // 155.000 (3-decimal points)
  'AUD/USD': 66_000, //  0.66000
  'USD/CAD': 136_000, // 1.36000
};

/** mulberry32 — tiny, fast, deterministic 32-bit PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash (FNV-1a) to derive a per-pair stream from (seed, pair). */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Feed {
  /** The seed this feed was created with (for display/diagnostics). */
  readonly seed: number;
  /** Current price of a pair WITHOUT advancing its stream. */
  currentPricePts(pair: CurrencyPair): number;
  /** Advance the pair's stream one tick and return it. */
  nextTick(pair: CurrencyPair): Tick;
  /**
   * Current GBP/<quote> conversion rate in points for the P&L engine, or null
   * when the quote currency is GBP (R = 1). MVP: every pair quotes in USD, JPY
   * or CAD; USD conversion uses the live GBP/USD price; others are approximated
   * via GBP/USD for MVP purposes and documented as such.
   */
  gbpQuoteRatePts(pair: CurrencyPair): number | null;
}

interface PairState {
  rng: () => number;
  pricePts: number;
  seq: number;
}

/** Max single-tick move, in points (kept small so prices drift realistically). */
const MAX_STEP_PTS = 15;

export function createFeed(seed: number): Feed {
  if (!Number.isInteger(seed)) throw new Error('seed must be an integer');

  const states = new Map<CurrencyPair, PairState>();
  for (const pair of MVP_PAIRS) {
    states.set(pair, {
      rng: mulberry32((seed ^ fnv1a(pair)) >>> 0),
      pricePts: BASE_PRICES_PTS[pair],
      seq: 0,
    });
  }

  function state(pair: CurrencyPair): PairState {
    const s = states.get(pair);
    if (!s) throw new Error(`unknown pair: ${pair}`);
    return s;
  }

  return {
    seed,

    currentPricePts(pair) {
      return state(pair).pricePts;
    },

    nextTick(pair) {
      const s = state(pair);
      // Symmetric integer step in [-MAX_STEP_PTS, +MAX_STEP_PTS].
      const step = Math.floor(s.rng() * (2 * MAX_STEP_PTS + 1)) - MAX_STEP_PTS;
      // Clamp far above zero so a long unlucky walk can never go non-positive.
      const floor = Math.max(1, Math.floor(BASE_PRICES_PTS[pair] / 2));
      const next = Math.max(floor, s.pricePts + step);
      const direction: TickDirection =
        next > s.pricePts ? 'up' : next < s.pricePts ? 'down' : 'flat';
      s.pricePts = next;
      s.seq += 1;
      return { pair, pricePts: next, direction, seq: s.seq };
    },

    gbpQuoteRatePts(pair) {
      // MVP simplification (documented in the design doc §5.3): convert all
      // non-GBP quote currencies via the live GBP/USD price. Exact for USD
      // quotes; an approximation for JPY/CAD quotes acceptable for a demo SUT.
      void isJpyQuoted(pair); // reserved for a future per-quote refinement
      return state('GBP/USD').pricePts;
    },
  };
}

/** Parse a `?seed=` value; returns the default seed when absent/invalid. */
export const DEFAULT_SEED = 20260708;

export function parseSeed(raw: string | null | undefined): number {
  if (raw === null || raw === undefined || raw.trim() === '') return DEFAULT_SEED;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_SEED;
}
