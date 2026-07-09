// Ticker (MF-05): the ONLY place that owns tick timing. Each interval advances
// every MVP pair exactly one tick, so a pair's feed `seq` always equals the
// number of elapsed intervals — which is what lets an E2E replay the seeded
// feed and predict the exact price shown at any observed seq (NFR-1).

import type { Feed, Tick } from '../core/feed.js';
import { MVP_PAIRS } from '../core/types.js';

export interface TickerHandle {
  stop(): void;
}

export const DEFAULT_TICK_MS = 800;

export function startTicker(
  feed: Feed,
  onTicks: (ticks: readonly Tick[]) => void,
  intervalMs: number = DEFAULT_TICK_MS,
  schedule: typeof setInterval = setInterval,
  cancel: typeof clearInterval = clearInterval,
): TickerHandle {
  const id = schedule(() => {
    const ticks = MVP_PAIRS.map((pair) => feed.nextTick(pair));
    onTicks(ticks);
  }, intervalMs);
  return {
    stop() {
      cancel(id);
    },
  };
}
