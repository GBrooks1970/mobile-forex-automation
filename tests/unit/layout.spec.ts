import { describe, expect, it } from 'vitest';
import { layoutFor } from '../../src/ui/layout.js';

describe('layoutFor (PRS §2.2 breakpoints)', () => {
  it('maps widths to the three layouts', () => {
    expect(layoutFor(375)).toBe('mobile');
    expect(layoutFor(768)).toBe('tablet');
    expect(layoutFor(1280)).toBe('desktop');
  });

  it('is correct on the exact boundaries', () => {
    expect(layoutFor(599)).toBe('mobile');
    expect(layoutFor(600)).toBe('tablet'); // 600-1024 inclusive is tablet
    expect(layoutFor(1024)).toBe('tablet');
    expect(layoutFor(1025)).toBe('desktop'); // > 1024 is desktop
  });
});
