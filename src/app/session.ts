// Demo-profile session (MF-04, PRS MVP §3.1): email/password login seamlessly
// generates a £10,000 demo profile. Pure logic with an injected Storage so unit
// tests never touch the real localStorage.

export interface Profile {
  userId: string;
  email: string;
  /** GBP pence — PRS default virtual seed balance £10,000.00 */
  balancePence: number;
}

export const SEED_BALANCE_PENCE = 1_000_000; // £10,000.00

const STORAGE_KEY = 'mfx.profile.v1';

export interface CredentialProblem {
  field: 'email' | 'password';
  message: string;
}

/** Demo-grade credential check: shaped email + non-empty password. */
export function validateCredentials(email: string, password: string): CredentialProblem[] {
  const problems: CredentialProblem[] = [];
  const trimmed = email.trim();
  // Light shape check (demo auth, not real auth): x@y with no spaces.
  if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
    problems.push({ field: 'email', message: 'Enter a valid email address' });
  }
  if (password.length === 0) {
    problems.push({ field: 'password', message: 'Enter a password' });
  }
  return problems;
}

/** Deterministic userId from the email (no RNG — NFR-1). */
export function userIdFor(email: string): string {
  const normalised = email.trim().toLowerCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < normalised.length; i++) {
    h ^= normalised.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `demo-${(h >>> 0).toString(16).padStart(8, '0')}`;
}

/** Create the PRS demo profile for a validated login. */
export function createProfile(email: string): Profile {
  return {
    userId: userIdFor(email),
    email: email.trim(),
    balancePence: SEED_BALANCE_PENCE,
  };
}

/** Persistence seam — a Storage-shaped dependency (localStorage in the app). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function saveProfile(store: KeyValueStore, profile: Profile): void {
  store.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadProfile(store: KeyValueStore): Profile | null {
  const raw = store.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Profile).userId === 'string' &&
      typeof (parsed as Profile).email === 'string' &&
      Number.isInteger((parsed as Profile).balancePence)
    ) {
      return parsed as Profile;
    }
    return null;
  } catch {
    return null; // corrupted storage never crashes the app
  }
}

export function clearProfile(store: KeyValueStore): void {
  store.removeItem(STORAGE_KEY);
}
