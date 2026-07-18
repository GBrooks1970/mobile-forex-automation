# Project Review: mobile-forex-automation

[<- Back to Index](../00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Cross-Cutting Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (Claude Fable 5)

Single-project repository; this is the only file in `03_PROJECT_REVIEWS/` per the
template's single-repo rule.

## Stack and intent (from README.md and package.json)

Vite 7 + TypeScript 5.9 (strict) SUT; Vitest 4 unit lane over the pure core; Playwright
1.61 E2E lane with three projects (Desktop Chrome, Pixel 7, iPhone 14); no runtime
dependencies at all - the app is dependency-free vanilla TS, and all four devDependencies
are toolchain ([package.json](../../../package.json) lines 21-26). Gate:
`npm run verify`. MIT-licensed, deployed to GitHub Pages.

## Review bullets

- **Architecture and pattern fidelity.** Clean four-layer split: pure core
  ([src/core/](../../../src/core/) - types, P&L, feed, validation, formatting; no DOM/IO,
  injected clocks), deterministic app state ([src/app/portfolio.ts](../../../src/app/portfolio.ts) -
  counter-based ids, timestamps passed in), string-template views
  ([src/ui/](../../../src/ui/)), and one orchestrator ([src/main.ts](../../../src/main.ts)).
  The Screenplay layer ([tests/screenplay/core.ts](../../../tests/screenplay/core.ts)) is a
  faithful, ~60-line Actor/Ability/Task/Question implementation with touch-first Tasks and
  read-only Questions; the decision to keep geometry-heavy breakpoint specs as plain
  Playwright (backlog MF-12) shows good judgement about where business language earns its
  keep.

- **Test coverage and approach.** 90 unit tests pin the PRS worked oracle (62.0 pips /
  +246.78 GBP / net 244.28 GBP), rounding symmetry, JPY conventions, swap
  triple-Wednesday, and parametrised validation tables
  ([tests/unit/boundaries.spec.ts](../../../tests/unit/boundaries.spec.ts)); 28 E2E
  executions cover the full lifecycle on desktop plus both device projects with touch
  (`tap()`), real-viewport breakpoint geometry, and a no-horizontal-overflow hygiene check
  ([tests/e2e/mobile/breakpoints.mobile.spec.ts](../../../tests/e2e/mobile/breakpoints.mobile.spec.ts)
  lines 42-55). The replay-oracle assertions are exact (no tolerances) - the strongest
  determinism evidence in the portfolio's E2E work.

- **Suite stability engineering.** Zero retries ([playwright.config.ts](../../../playwright.config.ts)
  line 11) is a confident choice backed by real de-flaking work: the single-owner ticker
  makes `seq` == elapsed intervals; specs read entry/exit from the **app-recorded**
  history row rather than racing live cells ([tests/e2e/close.spec.ts](../../../tests/e2e/close.spec.ts)
  lines 49-56); atomic `evaluate` snapshots avoid tick-boundary tearing
  ([tests/e2e/watchlist.spec.ts](../../../tests/e2e/watchlist.spec.ts) lines 63-71); and a
  genuine mobile flake (Close-button jitter from P&L-width reflow) was root-caused to CSS
  and fixed (`table-layout: fixed`, backlog MF-10).

- **Code quality.** Strict tsc with `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` passes; integer-only money with explicit
  half-away-from-zero rounding ([src/core/pnl.ts](../../../src/core/pnl.ts) lines 16-23);
  comments explain derivations, not mechanics. Deductions: the `innerHTML` email injection
  (R-1), the thrice-duplicated pair-unaware `toPts` (R-2), and no linter (R-3).

- **Documentation quality.** Backlog v5, design doc v0.4, ADR-0001, CHANGELOG, and three
  implementation logs are mutually consistent and consistent with the code - every
  quantified claim I checked (test counts, device projects, bug narratives, Pages URL)
  verified. The backlog's per-item delivery history doubles as an honest engineering
  diary (bugs caught are recorded alongside features shipped).

- **Strengths.** Determinism as a design property; honest scope labelling (mobile-web,
  not native - ADR-0001); testing the built artefact Pages ships; least-privilege CI with
  failure-only report upload; dependency-free runtime (zero supply-chain surface in the
  shipped app).

- **Weaknesses.** The R-1/R-2/R-3 items above; single-file Screenplay barrel absence is a
  non-issue at this size, but the test-support duplication (`toPts`, `gbp`) will grow if
  more journeys land; conversion-rate approximation for CAD/JPY quotes via GBP/USD is an
  MVP simplification - properly documented ([src/core/feed.ts](../../../src/core/feed.ts)
  lines 119-125) but worth remembering if new pairs or literal-value oracles are added.

## Deferred / planned-but-unimplemented coverage (backlog check)

- **Phase B native layer (Appium/Maestro):** explicitly deferred by ADR-0001 and the
  backlog's "Potential Next Steps"; nothing in the repo pretends otherwise. Consistent.
- **Accessibility (axe-core) and visual regression (Playwright baselines):** named in
  [docs/backlog.md](../../../docs/backlog.md) lines 130-131 as recognised portfolio gaps
  (B-4/B-5), not yet implemented - accurately labelled as potential next steps, and the
  semantic markup (labelled sections, `role="alert"`, scoped table headers) keeps the
  door open cheaply.
- **SL/TP orders:** the validation core fully implements SL/TP side rules
  ([src/core/validate.ts](../../../src/core/validate.ts) lines 46-61) and unit-tests them,
  but the UI never sets them (`stopLossPts: null` at
  [src/app/portfolio.ts](../../../src/app/portfolio.ts) lines 79-80, 92-93) and
  `CloseReason` only ever takes `'MANUAL'`. Deliberate MVP scope (design doc excludes
  limit/stop orders); the unused-but-tested rules are a small, acceptable YAGNI spend
  that bought the boundary-sweep finding.
- **Swap in the UI:** swap maths are unit-tested (incl. triple-Wednesday) but the MVP
  same-day close always passes `nightsHeld: 0`
  ([src/app/portfolio.ts](../../../src/app/portfolio.ts) line 126) - documented in the
  backlog (MF-06/07) and in code comments. Consistent.

## Data setup and auth assumptions

- No real auth: any shape-valid email + non-empty password mints a deterministic
  demo profile ([src/app/session.ts](../../../src/app/session.ts)) - clearly labelled
  demo-grade in code and README; no tokens, secrets, or external services anywhere in the
  suite. Data setup is wholly in-browser (`?seed=` + `localStorage`), so tests are
  hermetic; browser-context isolation gives each test a fresh profile with no
  cross-test state.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Cross-Cutting Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
