# Cross-Cutting Analysis (within the repository)

[<- Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (Claude Fable 5)

Single-repo review: per the template's customisation notes this section analyses the
cross-cutting seams *within* the repo - SUT vs unit lane vs E2E lane vs Screenplay layer
vs CI vs docs.

## Tool-Agnostic Tests

- The business rules live in pure TS functions consumed identically by Vitest, Playwright
  specs, and the app itself - the *logic* under test is runner-agnostic even though the
  harnesses are not.
- The Screenplay layer depends on Playwright only through the one `BrowseTheWeb` ability
  ([tests/screenplay/abilities/BrowseTheWeb.ts](../../tests/screenplay/abilities/BrowseTheWeb.ts));
  Tasks/Questions reach the page solely via the ability, so a future native Phase B could
  add a `UseTheNativeApp` ability without touching `core.ts`.
- The `data-testid`/`data-seq`/`data-direction` observability contract is plain DOM - any
  driver (Cypress, WebdriverIO, Appium webview) could consume it unchanged.

## Code-Agnostic Tests

- N/A as a multi-language concern - this is a single-language (TypeScript) repo by
  design; the portfolio's multi-stack parity story lives in the sudoku project instead.

## Single Source of Truth

- Strong: validation rules are one module shared by UI and tests
  ([src/core/validate.ts](../../src/core/validate.ts) header comment says exactly this);
  breakpoints are one pure function ([src/ui/layout.ts](../../src/ui/layout.ts)) mirrored
  by CSS; the PRS oracle is pinned once in the unit lane.
- Two small violations: the thrice-duplicated `toPts` and twice-duplicated `gbp()`
  formatter in test code (R-2), and `appVersion` duplicating `package.json` (R-6).
- [docs/backlog.md](../../docs/backlog.md) is declared and used as the status source of
  truth; README/CHANGELOG/design doc agree with it (checked claim-by-claim).

## API Contract Compliance

- N/A - no HTTP API; the "contract" here is the PRS data shapes (`open_trades`,
  `trade_history`), which [src/core/types.ts](../../src/core/types.ts) mirrors field-for-field
  in integer form, with immutability enforced by `Object.freeze` on history rows
  ([src/app/portfolio.ts](../../src/app/portfolio.ts) line 130).

## Screenplay Parity

- Consistent with the portfolio house style (`hand-baked-screenplay-pattern`):
  private-constructor static factories, `Actor.named(...).whoCan(...)`,
  `attemptsTo`/`asks`, `toString()` narratives on every Task/Question.
- One deliberate divergence, correctly reasoned: only the mobile journeys use Screenplay;
  desktop and geometry specs stay plain. The backlog records the rationale (MF-12).
- The structural `AbilityType` (prototype + name) is a genuine improvement over
  constructor-signature typing for private-constructor classes - a pattern worth
  upstreaming to the house library.

## Batch File Design

- N/A - no batch/shell scripts; all entry points are npm scripts
  ([package.json](../../package.json) lines 8-17), which is the simpler, portable choice.

## Documentation Alignment

- Exemplary. Verified alignments: README "90 unit + 28 Playwright executions" == local
  run; backlog device claims == [playwright.config.ts](../../playwright.config.ts)
  projects; CHANGELOG bug narratives (JPY x10, Close-button jitter) == code evidence
  (`table-layout: fixed` in [src/style.css](../../src/style.css); JPY factor comment in
  [src/core/pnl.ts](../../src/core/pnl.ts) line 56); backlog version/date headers current
  (v5, 2026-07-14) - notably avoiding the stale-header drift found in sibling repos.
- Only gap: the E2E-oracle-reuse trade-off is documented in spec comments but not in the
  README/design doc (R-5).

## Logging Alignment

- N/A as a drift concern - the app logs nothing (verified: no `console.*` in `src/`),
  and the MF-13 smoke evidence explicitly asserted zero console/page errors on the
  deployed demo. Playwright's `list` + failure-only HTML report is proportionate.

## Test Coverage Metrics

- 90 unit tests / 11 files over ~600 lines of core+app logic; 16 desktop + 12 mobile E2E
  executions; both mobile engines (Chromium + WebKit) exercised. No coverage tooling is
  configured (`vitest --coverage` absent) - acceptable at this size, but a c8 report
  would cheaply prove the "pure core fully covered" claim; see the
  [Annex](ANNEX/METRICS.md) for the verified numbers.

---

[<- Previous: Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md) | [Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
