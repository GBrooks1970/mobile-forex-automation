# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (Claude Fable 5)

## Test Pyramid

- Well-proportioned and honestly shaped: a broad unit base (90 tests over the pure core -
  the cheap oracle), a thin but high-value E2E cap (28 executions), and no redundant
  middle tier because the app has no service boundary to integration-test. The E2E lane is
  intentionally kept to journeys that only a browser can prove (touch, viewport geometry,
  live reflow, DOM wiring), pushing all arithmetic down to the unit lane. This is the
  pyramid done right, not inverted.

## SOLID Principles

- **SRP:** strong - each module has one reason to change (`feed` = what price next,
  `ticker` = when, `portfolio` = state, `format` = edge rendering, `validate` = rules).
- **OCP:** the Screenplay Ability seam and the `schedule`/`cancel` injection in
  [src/app/ticker.ts](../../src/app/ticker.ts) (lines 19-20) allow extension without
  editing.
- **LSP:** N/A - little inheritance; interfaces (`Feed`, `KeyValueStore`, `Task`,
  `Question`) are small and honoured.
- **ISP:** exemplary - `KeyValueStore` exposes only get/set/remove; `BrowseTheWeb` exposes
  only the page; `AbilityType` is a minimal structural type.
- **DIP:** the core depends on injected abstractions (clock via passed timestamps, storage
  via `KeyValueStore`, scheduler via `setInterval` param), never on concretes - which is
  precisely what makes it unit-testable without a DOM.

## KISS

- Consistently simple: vanilla TS with zero runtime dependencies, string-template
  rendering instead of a framework, a ~60-line hand-rolled Screenplay core, a tiny
  mulberry32 PRNG. Complexity appears only where the domain demands it (integer money,
  rounding, swap rules), and there it is commented.

## YAGNI

- Mostly disciplined. One tolerated over-build: SL/TP and swap/triple-Wednesday logic is
  implemented and unit-tested but unreachable from the MVP UI
  ([src/core/validate.ts](../../src/core/validate.ts) lines 46-61;
  [src/app/portfolio.ts](../../src/app/portfolio.ts) line 126). Defensible - it is
  faithful to the PRS math, cheap, and the boundary sweep over it caught the real JPY x10
  bug - so the spend paid for itself. `gbpQuoteRatePts`'s `void isJpyQuoted(pair)`
  placeholder ([src/core/feed.ts](../../src/core/feed.ts) line 123) is a whiff of
  speculative generality but harmless.

## REST + OpenAPI

- N/A - no HTTP surface. The nearest analogue is fidelity to the PRS data contracts
  (`open_trades`, `trade_history`), which [src/core/types.ts](../../src/core/types.ts)
  models field-for-field with immutability on closed rows. Strong.

## ISTQB Strategies

- Explicitly and effectively applied: boundary-value analysis and equivalence partitioning
  drive [tests/unit/boundaries.spec.ts](../../tests/unit/boundaries.spec.ts) (rounding at
  exact-half both signs, commission from the smallest lot, JPY vs non-JPY partitions,
  parametrised validation tables) and that discipline caught a production defect. Decision
  logic (BUY/SELL x TP/SL sides) is table-tested. State transition (open -> close ->
  history, sign-in -> sign-out) is covered at E2E. A genuinely instructive ISTQB example.

## Pedagogical Comments

- Best-in-portfolio. Comments explain *why* (the exact-cents derivation, the
  single-owner-ticker rationale, the race-free-oracle notes, the structural-AbilityType
  lesson) rather than restating code. File-header comments orient the reader to each
  module's contract and constraints (no DOM, no `Date.now()`, integers only). This is a
  repo a mid-level engineer can learn the replay-oracle and Screenplay patterns from
  directly.

## Summary

Architecturally this is the strongest small repo in the portfolio for teaching
deterministic UI automation: clean DIP-driven layering, a right-way-up pyramid, real
ISTQB payoff, and honest scope. The only architectural nits are the test-support DRY
gap (R-2) and the absence of a lint gate (R-3) - neither structural.

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
