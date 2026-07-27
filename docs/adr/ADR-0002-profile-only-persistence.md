# ADR-0002 — Persist the demo profile, reset trading activity on reload

**Status:** Accepted

**Date:** 2026-07-27

**Deciders:** Gary Brooks (owner), Codex

## Context

The responsive demo has no backend. It stores a `Profile` in `localStorage`, which keeps the user
signed in across a reload, but creates a new in-memory `Portfolio` whenever the trading shell is
rendered. Consequently, realised balance changes, open positions, and trade history last only for
the current page lifetime.

That behaviour was technically deterministic but not previously stated as a product contract. A
user could reasonably infer that all account state is durable because the profile survives reload.
The project therefore needs an explicit decision between persisting a complete account ledger and
retaining the lightweight demo reset.

## Decision

Retain **profile-only persistence**:

- `localStorage` preserves the signed-in identity (`userId` and email) and the fixed £10,000 demo
  balance seed. The stored `balancePence` is an initialisation value, not a durable account balance.
- Each successful login or page reload constructs a fresh in-memory `Portfolio` from that seed.
  Realised balance changes, open positions, and closed-trade history therefore reset on reload.
- Reload keeps the profile signed in. Explicit sign-out clears the stored profile.
- Product copy must say: **“Demo activity resets on reload; your profile stays signed in.”** It must
  not imply that the demo provides durable account or trade-history storage.

## Rationale

- The SUT is a deterministic test-automation showcase, not a production trading account.
- Page-lifetime trading state keeps the implementation small, local, resettable, and free of data
  migration or recovery concerns.
- Preserving identity avoids unnecessary repeat login while the visible cue makes the reset boundary
  honest and predictable.

## Consequences

- A reload restores the trading shell for the same profile with £10,000, no positions, and no
  history, even if the prior page had realised profit or loss.
- CODEX-05 must surface the approved copy in the trading UI and add a deterministic E2E journey that
  proves both sides of the contract.
- Any future move to durable trading state requires a separate design decision covering schema,
  validation, migrations, corruption handling, and tests; it must not emerge accidentally from the
  profile payload.

## Alternatives

- **Persist the full portfolio in `localStorage`:** rejected for this demo because it adds a ledger
  schema and migration/recovery responsibilities without improving the automation objective.
- **Persist nothing:** rejected because forcing a fresh login on every reload adds friction and
  discards the already-useful identity/session behaviour.
