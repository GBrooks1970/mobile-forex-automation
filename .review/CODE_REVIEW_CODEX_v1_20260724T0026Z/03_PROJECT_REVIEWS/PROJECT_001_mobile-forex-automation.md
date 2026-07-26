# Project Review: Mobile Forex Automation

[<- Back to Index](../00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Cross-Cutting Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (Codex GPT-5)

## Project Purpose and Stack

The repository delivers a responsive-web forex demo SUT and its automation suite because the source
PRS has no executable application. The stack is Vite/vanilla TypeScript, Vitest, Playwright device
emulation, a small framework-free Screenplay layer, GitHub Actions, and GitHub Pages. There are no
runtime package dependencies and no network/API dependency in the SUT.

## Review

- **Architecture and design patterns:** Clear layering separates pure price/P&L/validation logic,
  deterministic feed generation, the ticker's timing responsibility, Portfolio state, UI rendering,
  and tests. The injected `KeyValueStore`, passed clocks, and injectable ticker scheduler are strong
  examples of dependency inversion. The main architectural ambiguity is the boundary between the
  persisted profile and disposable in-memory trading state (R-3).
- **Deterministic SUT:** Per-pair PRNG streams make polling order irrelevant, and a single ticker
  advances every pair exactly once per interval. Integer points/lots/pence and edge-only formatting
  make the arithmetic inspectable. Safe-integer/domain limits are missing on the user lot input
  (R-4), and non-USD conversion remains an explicitly accepted MVP approximation.
- **Playwright desktop/mobile journeys:** Device projects use actual Pixel 7 and iPhone 14 descriptors,
  touch input, mobile viewport assertions, geometry, overflow checks, and WebKit/Chromium engines.
  The built artifact is served with Vite preview. Coverage is high-value rather than exhaustive, but
  the local server-reuse policy weakens artifact ownership (R-2), and JPY/SELL integration partitions
  remain absent (R-6).
- **Screenplay fidelity:** Actor, Ability, Task, and Question roles are recognisable and compact.
  Business journeys read well, and geometry-heavy assertions sensibly remain plain Playwright. Tasks
  still contain Playwright assertions and direct locator knowledge, there is no Interaction layer or
  instrumentation, and part of the mobile file bypasses Screenplay; these are acceptable KISS choices
  at this repository size, not pattern failures.
- **Unit/core strategy:** The 90-test unit lane pins the independent PRS oracle, exact-half rounding,
  commission, swap/triple Wednesday, JPY/non-JPY branches, BUY/SELL direction, validation boundaries,
  session storage, lifecycle transitions, and responsive boundaries. No coverage provider or threshold
  is configured, so case count is strong behavioural evidence but not a line/branch coverage measure.
- **Runtime lifecycle and isolation:** Each Playwright test gets a fresh browser context; no external
  data, token, secret, service, or wall-clock wait drives assertions. Ticker stop and resize-listener
  cleanup are explicit on sign-out. Reload behaviour resets Portfolio activity (R-3), and one replay
  assertion takes a non-atomic tick snapshot (R-5).
- **CI, documentation, and portfolio credibility:** The latest `main` CI and Pages runs are successful,
  the full local gate passed, audit is clean, MIT is declared, and the prior review cycle is fully
  documented. Deployment is not conditional on verification (R-1), and small README/design/runtime
  contract drifts remain (R-7, R-8).

## Deferred and Planned Coverage

- No `test.skip`, `test.fixme`, focused test, quarantine tag, or required unimplemented backlog item
  was found.
- Native Flutter/Appium/Maestro remains an optional Phase B by ADR-0001, not hidden debt in the
  delivered mobile-web scope.
- Accessibility (axe) and visual regression are explicitly optional next steps. They should not be
  represented as current coverage.
- Stop-loss/take-profit UI and overnight positions are not implemented in the MVP, although their
  validation/swap core is unit-tested. The scope is documented and does not invalidate the delivered
  same-day manual-close journey.

## Verdict

Strong portfolio project, with no HIGH risk and a genuinely passing gate. It demonstrates senior
judgement in determinism, test layering, device-emulation honesty, and boundary-based unit design.
The next remediation cycle should first protect deployment and local gate integrity, then settle the
reload persistence contract and numeric bound.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Cross-Cutting Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
