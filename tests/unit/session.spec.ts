import { describe, expect, it } from 'vitest';
import {
  SEED_BALANCE_PENCE,
  clearProfile,
  createProfile,
  loadProfile,
  saveProfile,
  userIdFor,
  validateCredentials,
  type KeyValueStore,
} from '../../src/app/session.js';

function fakeStore(): KeyValueStore & { dump(): Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

describe('createProfile (PRS MVP §3.1)', () => {
  it('seeds exactly £10,000.00 as integer pence', () => {
    const profile = createProfile('ada@example.com');
    expect(profile.balancePence).toBe(1_000_000);
    expect(profile.balancePence).toBe(SEED_BALANCE_PENCE);
  });

  it('derives a deterministic userId from the normalised email (NFR-1: no RNG)', () => {
    expect(userIdFor('ada@example.com')).toBe(userIdFor('  ADA@EXAMPLE.COM '));
    expect(userIdFor('ada@example.com')).not.toBe(userIdFor('bob@example.com'));
    expect(createProfile('ada@example.com').userId).toMatch(/^demo-[0-9a-f]{8}$/);
  });
});

describe('validateCredentials', () => {
  it('accepts a shaped email and non-empty password', () => {
    expect(validateCredentials('ada@example.com', 'pw')).toEqual([]);
  });

  it('rejects malformed emails', () => {
    for (const bad of ['', 'ada', 'ada@', 'ada@example', 'a b@example.com']) {
      expect(validateCredentials(bad, 'pw').map((p) => p.field)).toContain('email');
    }
  });

  it('rejects an empty password', () => {
    expect(validateCredentials('ada@example.com', '').map((p) => p.field)).toContain('password');
  });
});

describe('profile persistence (injected store)', () => {
  it('round-trips a profile', () => {
    const store = fakeStore();
    const profile = createProfile('ada@example.com');
    saveProfile(store, profile);
    expect(loadProfile(store)).toEqual(profile);
  });

  it('returns null when nothing is stored, after clear, and on corrupt data', () => {
    const store = fakeStore();
    expect(loadProfile(store)).toBeNull();

    saveProfile(store, createProfile('ada@example.com'));
    clearProfile(store);
    expect(loadProfile(store)).toBeNull();

    store.setItem('mfx.profile.v1', '{not json');
    expect(loadProfile(store)).toBeNull();
    store.setItem('mfx.profile.v1', JSON.stringify({ nonsense: true }));
    expect(loadProfile(store)).toBeNull();
  });
});
