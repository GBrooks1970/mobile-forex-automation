# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (Codex GPT-5)

## Test Pyramid

- The pyramid is well proportioned: 90 fast unit cases establish financial and validation correctness,
  while 29 browser executions prove DOM wiring, device context, touch, responsive geometry, and the
  user lifecycle.
- No service/integration middle layer is needed because the static demo has no backend or external
  boundary.
- E2E imports production core helpers for internal-consistency checks, but the unit lane independently
  pins the PRS oracle; the documentation now explains this distinction.
- No coverage threshold measures whether the 90 tests cover all branches, and the browser cap omits
  JPY/SELL integration partitions (R-6).

## SOLID Principles

- **Single Responsibility:** Modules are narrowly scoped: feed chooses prices, ticker chooses timing,
  Portfolio owns state transitions, format owns presentation conversion, validate owns rules, and UI
  modules render one region.
- **Open/Closed:** Feed, store, scheduler, and Screenplay seams permit substitution. Pair-specific
  conversion would still require editing the feed/core contract, which is reasonable for the MVP.
- **Liskov Substitution:** N/A - inheritance is minimal. Structural interfaces are small and their
  implementations preserve the expected contracts.
- **Interface Segregation:** `KeyValueStore`, `Feed`, `Task`, `Question`, and `AbilityType` expose only
  what clients need.
- **Dependency Inversion:** Core logic receives timestamps and rates, session logic receives storage,
  ticker logic receives scheduling functions, and Screenplay components receive Page through an
  Ability.
- The persistence boundary is not yet a coherent abstraction: initial profile state is stored, while
  Portfolio mutations bypass storage (R-3).

## KISS

- Vanilla TypeScript and zero runtime dependencies are proportionate to a deliberately small SUT.
- The hand-rolled Screenplay layer is roughly the minimum useful implementation and avoids bringing
  framework lifecycle into an otherwise simple project.
- Integer derivations are explained close to code, making the non-trivial P&L maths easier to review.
- A separate full application framework, backend, database, or container stack would add little value
  to the current automation objective.

## YAGNI

- Native drivers, device farms, live price data, real authentication, and complex charts are correctly
  excluded from the delivered phase.
- SL/TP and overnight swap logic are not reachable through the UI, but they are source-spec behaviour,
  inexpensive in the pure core, and their boundary suite already found a JPY defect.
- The unused `void isJpyQuoted(pair)` placeholder in the conversion source is speculative and could be
  removed until pair-specific rates are actually implemented.
- Persistence should not be expanded until the owner answers the profile-only versus account-state
  question; either answer can remain simple.

## REST and OpenAPI

N/A - no HTTP/API boundary exists. There are no tokens, remote data calls, request schemas, or OpenAPI
contracts to assess. The analogous data-contract review is positive: typed open/history records,
validation before transitions, and frozen history rows. Numeric maxima and persistence semantics are
the remaining contract gaps.

## ISTQB Strategies

- Boundary-value analysis is explicit at zero/one lot hundredth, exact-half rounding, entry-equal
  SL/TP, timestamp equality, and responsive breakpoints.
- Equivalence partitions cover valid/invalid credentials, BUY/SELL, JPY/non-JPY, positive/negative
  P&L, and mobile/tablet/desktop layout.
- State-transition coverage exercises signed out -> signed in -> order open -> close -> history ->
  signed out, with invalid-close paths in unit tests.
- Decision-table style parameterisation is used for direction and SL/TP sides.
- Risk-based coverage is good, but one JPY SELL browser journey would connect the most important unit
  partitions through the UI (R-6).

## Pedagogical Comments

- Comments consistently explain "why": per-pair streams, one ticker owner, integer derivations,
  table-layout stability, snapshot races, and structural ability typing.
- The project demonstrates how deterministic replay replaces guesswork and arbitrary tolerances.
- The Screenplay layer is readable without hiding Playwright mechanics from learners.
- Some comments overclaim: the watchlist read is described as a point-in-time snapshot although it is
  not atomic (R-5), and documentation claims need reconciliation (R-8).

## Architecture Verdict

The architecture is simple, testable, and unusually strong for a portfolio-sized demo. SOLID and KISS
are applied as enabling constraints rather than ceremony. The key improvement is operational
architecture: bind deployed and locally tested artifacts to successful verification, then clarify
whether trading state is durable or deliberately ephemeral.

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
