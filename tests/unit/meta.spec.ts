import { describe, expect, it } from 'vitest';
import { appName, appVersion } from '../../src/meta.js';

// MF-01 placeholder: proves the Vitest lane is wired end-to-end against a real
// module. The substantive unit suite (P&L core vs the PRS oracle) lands in MF-09.
describe('app metadata', () => {
  it('names the application', () => {
    expect(appName).toBe('Forex Demo');
  });

  it('carries a semver-shaped version', () => {
    expect(appVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
