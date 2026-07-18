# Executive Summary

[<- Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Risks and Issues ->](02_RISKS_AND_ISSUES.md)

**Reviewer:** AI assistant (Claude Fable 5)

## What this repository is

`mobile-forex-automation` fills the portfolio's mobile-automation gap (PORTFOLIO_BACKLOG
P-03). Because the source PRS describes an app that does not exist, the repo deliberately
ships two things ([README.md](../../README.md) lines 6-16):

1. a minimal, deterministic **System Under Test** - a responsive-web vertical slice of a
   forex demo (login -> 5-pair watchlist -> market order -> close -> P&L -> history ->
   adaptive layout), driven by a seeded mock price feed; and
2. the **mobile automation suite** that is the actual deliverable - Playwright device
   emulation (Pixel 7 / iPhone 14, touch-first), a hand-rolled Screenplay layer, and a
   Vitest unit suite over the pure P&L/validation core.

The scope is honestly labelled: ADR-0001 records this as *mobile-web* automation
("A now, native later"), not a native-app (Appium) credential.

## Design Quality

- **Determinism as an architectural property, not a test trick.** The seeded feed
  ([src/core/feed.ts](../../src/core/feed.ts)) uses per-pair PRNG streams; the ticker
  ([src/app/ticker.ts](../../src/app/ticker.ts)) is the single owner of tick timing so
  per-pair `seq` equals elapsed intervals; rows expose `data-seq`/`data-direction`
  ([src/ui/watchlist.ts](../../src/ui/watchlist.ts) lines 30-42). Together these let an
  E2E replay the feed and assert the *exact* on-screen price at any observed seq -
  timing-independent, tolerance-free assertions.
- **Integer-only money.** Prices in points, lots in hundredths, money in pence/cents
  ([src/core/types.ts](../../src/core/types.ts) lines 1-9); decimal strings appear only at
  the formatting edge ([src/core/format.ts](../../src/core/format.ts)). Rounding is an
  explicit, tested half-away-from-zero ([src/core/pnl.ts](../../src/core/pnl.ts) lines 16-23).
- **Clean layering.** `src/core/` is pure (no DOM, no `Date.now()`, no RNG without a
  seed); `src/app/` is deterministic state; `src/ui/` renders; `src/main.ts` orchestrates.
  Clocks and storage are injected seams ([src/app/session.ts](../../src/app/session.ts)
  lines 55-60).
- **A faithful, minimal Screenplay layer** ([tests/screenplay/](../../tests/screenplay/)):
  Actor/Ability/Task/Question with touch-first Tasks; geometry-heavy breakpoint checks are
  deliberately left as plain Playwright - a defensible altitude decision recorded in the
  backlog (MF-12).

## Code Quality

- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes` - [tsconfig.json](../../tsconfig.json)) passes cleanly.
- Pedagogical comments explain *why* (e.g. the exact-cents derivation in
  [src/core/pnl.ts](../../src/core/pnl.ts) lines 50-56, the race-free oracle notes in
  [tests/e2e/close.spec.ts](../../tests/e2e/close.spec.ts) lines 49-52).
- Test hygiene is strong: zero retries, no sleeps, `expect.poll`/web-first assertions for
  synchronisation, atomic in-page snapshot reads to avoid tearing across tick boundaries
  ([tests/e2e/watchlist.spec.ts](../../tests/e2e/watchlist.spec.ts) lines 58-71).
- Weak spots exist but are small: raw `innerHTML` interpolation of the user email
  (R-1), a thrice-duplicated pair-unaware test parser (R-2), and no lint gate (R-3).

## Main Highlights

- **Gate verified green locally:** `npm run verify` = strict typecheck + 90 unit tests +
  28 Playwright executions (16 desktop + 6 x 2 mobile device projects), all passing; the
  E2E lane runs against the **built** artefact (`vite build && vite preview`), the same
  artefact Pages deploys ([playwright.config.ts](../../playwright.config.ts) lines 34-40).
- **`npm audit`: 0 vulnerabilities**; lockfile v3, current; MIT licence present.
- **Documentation alignment is exemplary:** every quantified claim in
  [docs/backlog.md](../../docs/backlog.md) (90 unit / 28 E2E / device projects / JPY x10
  bug caught by the boundary sweep) was verified against the code or the local run.
- The unit suite **caught a real 10x JPY P&L bug** (MF-09) and the mobile suite **caught a
  real touch-target flakiness bug** (jittering Close button, fixed by `table-layout:
  fixed`) - both recorded with their fixes, which is exactly the evidence a portfolio
  reviewer wants.

## Pedagogical Value

- The repo teaches the highest-value automation lesson in the portfolio: **make the SUT
  observable and deterministic, then assert exact values** - the replay-oracle pattern in
  [tests/e2e/watchlist.spec.ts](../../tests/e2e/watchlist.spec.ts) lines 43-51 is a
  textbook example.
- The MF-09 boundary sweep ([tests/unit/boundaries.spec.ts](../../tests/unit/boundaries.spec.ts))
  demonstrates ISTQB boundary-value/equivalence-partition technique paying off with a real
  defect.
- The hand-rolled Screenplay core (~60 lines,
  [tests/screenplay/core.ts](../../tests/screenplay/core.ts)) shows the pattern without
  framework magic, including a subtle TS lesson (structural `AbilityType` so
  private-constructor classes work as lookup keys).

---

[<- Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Risks and Issues ->](02_RISKS_AND_ISSUES.md)
