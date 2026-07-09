import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startTicker } from '../../src/app/ticker.js';
import { createFeed, type Tick } from '../../src/core/feed.js';
import { MVP_PAIRS } from '../../src/core/types.js';

describe('startTicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances every MVP pair exactly one tick per interval (seq == intervals elapsed)', () => {
    const feed = createFeed(42);
    const batches: (readonly Tick[])[] = [];
    const handle = startTicker(feed, (ticks) => batches.push(ticks), 800);

    vi.advanceTimersByTime(800 * 3);
    handle.stop();

    expect(batches).toHaveLength(3);
    for (const [i, batch] of batches.entries()) {
      expect(batch.map((t) => t.pair)).toEqual([...MVP_PAIRS]);
      for (const tick of batch) expect(tick.seq).toBe(i + 1);
    }
  });

  it('replays identically to a bare feed with the same seed (NFR-1)', () => {
    const uiFeed = createFeed(7);
    const seen: Tick[] = [];
    const handle = startTicker(uiFeed, (ticks) => seen.push(...ticks), 100);
    vi.advanceTimersByTime(100 * 2);
    handle.stop();

    const replay = createFeed(7);
    const expected: Tick[] = [];
    for (let i = 0; i < 2; i++) for (const pair of MVP_PAIRS) expected.push(replay.nextTick(pair));

    expect(seen).toEqual(expected);
  });

  it('stop() halts ticking', () => {
    const feed = createFeed(1);
    const batches: unknown[] = [];
    const handle = startTicker(feed, (t) => batches.push(t), 100);
    vi.advanceTimersByTime(250);
    handle.stop();
    vi.advanceTimersByTime(1_000);
    expect(batches).toHaveLength(2);
  });
});
