# Cross-Cutting Analysis

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260807T1410Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (Claude)

*Note: As a single-repository review, cross-cutting analysis focuses on integration consistency across application layers, test frameworks, CI pipelines, and documentation within `mobile-forex-automation`.*

## 1. Tool-Agnostic Tests
- The core financial calculations (P&L, commission, swap, rounding) and validation rules are pure functions in `src/core/`, completely independent of any test runner or browser environment.
- Vitest unit tests verify these pure domain boundaries without DOM dependencies or Playwright reliance.

## 2. Code-Agnostic Tests
- Playwright E2E tests interact strictly via standard user-facing attributes (`data-testid`, semantic HTML elements, touch tap events), ensuring tests remain resilient to internal refactoring.

## 3. Single Source of Truth
- `package.json` acts as the single source of truth for version information (`appVersion`), imported directly into `src/meta.ts` (TRIAGE-06).
- `docs/backlog.md` serves as the authoritative status log for all delivered work (MF-01..MF-14, TRIAGE-01..06, CODEX-01..10).

## 4. API Contract Compliance
- `N/A - Single-page SUT with mock internal feed; no REST/OpenAPI external endpoints.`

## 5. Screenplay Parity
- The hand-rolled Screenplay pattern under `tests/screenplay/` mirrors the portfolio's house style (`hand-baked-screenplay-pattern`), using structural ability lookup for private constructor classes.

## 6. Batch File Design
- `N/A - Repository uses npm scripts and Node.js preflight scripts rather than standalone batch files.`

## 7. Documentation Alignment
- `README.md`, `docs/design-document.md`, `ADR-0001`, `ADR-0002`, and `docs/backlog.md` are perfectly aligned regarding the paper-trading money model and profile-only reload reset contract.

## 8. Logging Alignment
- Clean console output management: the application suppresses unnecessary logs, while CI workflows produce structured output for verification and dependency auditing.

## 9. Test Coverage Metrics
- 97 Vitest unit tests covering 100% of domain core modules (`pnl.ts`, `feed.ts`, `validate.ts`, `portfolio.ts`).
- 31 Playwright E2E test executions covering desktop Chromium, mobile Android (Pixel 7), and mobile iOS (iPhone 14) viewports.

---

[<- Previous: Project Review](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260807T1410Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
```

---