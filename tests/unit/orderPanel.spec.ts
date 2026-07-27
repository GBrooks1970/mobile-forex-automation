import { describe, expect, it } from 'vitest';
import { MAX_VOLUME_LOTS2 } from '../../src/core/types.js';
import { parseLots2, renderOrderPanel } from '../../src/ui/orderPanel.js';

describe('parseLots2', () => {
  it('parses whole and fractional lots to integer hundredths', () => {
    expect(parseLots2('0.10')).toBe(10);
    expect(parseLots2('1')).toBe(100);
    expect(parseLots2('0.05')).toBe(5);
    expect(parseLots2('2.50')).toBe(250);
    expect(parseLots2(' 0.1 ')).toBe(10); // trims, one-dp allowed
    expect(parseLots2('100.00')).toBe(MAX_VOLUME_LOTS2);
  });

  it('rejects zero, over-maximum, unsafe-integer, malformed, and over-precise input', () => {
    for (const bad of [
      '0',
      '100.01',
      '90071992547410.00',
      '',
      'abc',
      '0.005',
      '1.234',
      '-0.10',
      '.5',
      '1.',
    ]) {
      expect(parseLots2(bad)).toBeNull();
    }
  });

  it('declares the same range and precision at the HTML input boundary', () => {
    const html = renderOrderPanel();
    expect(html).toContain('type="number"');
    expect(html).toContain('min="0.01"');
    expect(html).toContain('max="100.00"');
    expect(html).toContain('step="0.01"');
    expect(html).toContain('Allowed range: 0.01–100.00 lots.');
  });
});
