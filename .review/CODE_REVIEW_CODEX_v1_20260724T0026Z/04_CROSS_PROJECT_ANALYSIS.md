# Cross-Cutting Analysis

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (Codex GPT-5)

For this single-repository review, "cross-project" means the interaction between the SUT, pure core,
desktop/mobile suites, Screenplay layer, CI/Pages workflows, and documentation.

## Tool-Agnostic Tests

- The pure TypeScript domain cases express examples and boundaries without browser concerns, so their
  test intent could move to another unit framework cheaply.
- Playwright-specific E2E locators, device descriptors, tracing, and touch APIs are deliberately
  tool-bound because those are the behaviours being demonstrated.
- Screenplay Tasks/Questions reduce scenario-level coupling but wrap Playwright directly through
  `BrowseTheWeb`; there is no second driver implementation claiming tool portability.

## Code-Agnostic Tests

- P&L examples and validation tables are business-readable enough to reimplement in another language,
  even though they are TypeScript rather than Gherkin.
- The desktop/mobile journey names describe user outcomes, but implementation imports production core
  helpers for replay/internal-consistency assertions.
- There are no executable specifications independent of TypeScript. This is an accepted design choice
  for a compact portfolio project, not a missing runner.

## Single Source of Truth

- `docs/backlog.md` is the authoritative status record and correctly reports zero outstanding work.
- `package.json` is now the single source for the app version; the previous duplicated literal was
  removed.
- Production price formatting and shared test price parsing both derive precision from
  `pointDecimals`, resolving the first review's JPY parser drift.
- The money model is not fully single-sourced in documentation: design FR-3 says balance/margin
  changes on open while code/backlog deliberately say cash does not change (R-8).

## API Contract Compliance

N/A - the SUT has no server API, REST endpoint, OpenAPI description, token, or authentication service.
The applicable contract is the PRS-derived trade model:

- Open and history types retain pair, direction, lot, price, user, timestamps, and signed P&L fields.
- History rows are frozen and close-time ordering is validated.
- The UI exposes only same-day manual close, while SL/TP/swap variants remain domain-only.

## Screenplay Parity

- Actor, Ability, Task, and Question concepts align with the portfolio's hand-rolled house style.
- The browser Page is accessible only through `BrowseTheWeb` inside Screenplay components.
- Mobile business flow uses Tasks/Questions; responsive geometry remains plain Playwright by explicit
  design.
- Direct locator calls and assertions inside Tasks keep the layer simple but reduce interaction-level
  reuse and diagnostic instrumentation compared with a fuller Screenplay implementation.

## Batch File Design

N/A - the repository ships no batch, PowerShell, shell, Docker, or compose orchestration. Cross-platform
commands are npm scripts, Vite/Playwright configuration, and GitHub Actions YAML.

## Documentation Alignment

- Backlog v6, latest handover v2, CHANGELOG, and source history agree that MF-01..MF-14 and
  TRIAGE-01..06 are complete.
- README accurately states mobile-web scope, deterministic mock data, device projects, test-pyramid
  intent, and MIT licensing.
- README's current E2E count is stale at 28 instead of 29, and design FR-3 conflicts with the accepted
  no-margin money model (R-8).
- The reload persistence boundary is not described clearly enough to decide whether state loss is a
  defect or an intentional demo reset (R-3).

## Logging Alignment

- The application has no operational logging subsystem, appropriate for a client-only static demo.
- Playwright list output and failure-only HTML report/trace retention provide useful failure evidence.
- Screenplay `toString()` descriptions are not emitted, so the abstraction adds readability in source
  but not runtime activity logs.
- CI does not publish unit/JUnit evidence on success; this is optional for the repository's size.

## Test Coverage Metrics

- Observed unit evidence: 11 files, 90/90 passing Vitest cases.
- Observed E2E evidence: 17 desktop executions plus 6 mobile source tests across two device projects,
  totalling 29/29 passing.
- A focused repeat probe ran the deterministic watchlist replay assertion 20 times; all 20 passed,
  though the non-atomic read remains structurally racy (R-5).
- No Istanbul/V8 line, branch, function, or statement coverage provider/threshold is configured.
- Integration partitions are intentionally small but omit JPY and SELL in the browser lane (R-6).

---

[<- Previous: Project Review](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
