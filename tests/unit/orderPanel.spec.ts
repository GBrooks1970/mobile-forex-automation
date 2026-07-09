import { describe, expect, it } from 'vitest';
import { parseLots2 } from '../../src/ui/orderPanel.js';

describe('parseLots2', () => {
  it('parses whole and fractional lots to integer hundredths', () => {
    expect(parseLots2('0.10')).toBe(10);
    expect(parseLots2('1')).toBe(100);
    expect(parseLots2('0.05')).toBe(5);
    expect(parseLots2('2.50')).toBe(250);
    expect(parseLots2(' 0.1 ')).toBe(10); // trims, one-dp allowed
  });

  it('rejects malformed, over-precise, or non-numeric input', () => {
    for (const bad of ['', 'abc', '0.005', '1.234', '-0.10', '.5', '1.']) {
      expect(parseLots2(bad)).toBeNull();
    }
  });
});
