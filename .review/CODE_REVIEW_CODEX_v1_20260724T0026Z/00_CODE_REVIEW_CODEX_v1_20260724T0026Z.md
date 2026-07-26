# Code Review: Mobile Forex Automation

**Reviewer:** AI assistant (Codex GPT-5)
**Date:** 2026-07-24T00:26Z
**Scope:** Full repository review at `d5fb448`, including the deterministic demo SUT, unit and
Playwright suites, Screenplay layer, CI/Pages workflows, documentation, dependencies, security,
licence, and alignment with `docs/backlog.md`.

## Table of Contents

1. [Executive Summary](01_EXECUTIVE_SUMMARY.md)
2. [Risks and Issues](02_RISKS_AND_ISSUES.md)
3. [Project Review](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)
4. [Cross-Cutting Analysis](04_CROSS_PROJECT_ANALYSIS.md)
5. [Recommendations](05_RECOMMENDATIONS.md)
6. [Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md)
7. [Migration Plans](07_MIGRATION_PLANS.md)
8. [Annex: Metrics and Validation Evidence](ANNEX/METRICS.md)

## Structure Summary

- The [Executive Summary](01_EXECUTIVE_SUMMARY.md) gives the portfolio-level verdict, strengths,
  current health, and principal concerns.
- [Risks and Issues](02_RISKS_AND_ISSUES.md) ranks eight actionable findings from MEDIUM to LOW
  with file-and-line evidence, impact, and practical remediation.
- The [Project Review](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md) evaluates the one
  repository as the template's `PROJECT_001`.
- The [Cross-Cutting Analysis](04_CROSS_PROJECT_ANALYSIS.md) compares the SUT, domain core,
  Screenplay suite, CI, deployment, and documentation within this repository.
- [Recommendations](05_RECOMMENDATIONS.md), [Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md),
  and [Migration Plans](07_MIGRATION_PLANS.md) turn the findings into sequenced engineering work.
- The [Metrics Annex](ANNEX/METRICS.md) records commands and observed results so quantified claims
  remain auditable.

## Key Findings

1. **MEDIUM - Pages deployment is not conditional on the verification gate.** `CI` and `Pages` are
   independent push workflows, and the deploy job depends only on the Pages build. A main-branch
   commit can therefore deploy while `npm run verify` fails.
2. **MEDIUM - Local E2E can silently test an unrelated server.** `reuseExistingServer: !CI` accepts
   any responder on port 4173, weakening the local `npm run verify` evidence.
3. **MEDIUM - Reload preserves identity but discards account activity.** Closing a trade updates only
   the in-memory `Portfolio`; a reload reconstructs the original stored profile balance and loses
   open positions and history. The intended persistence boundary is not stated clearly enough.
4. **MEDIUM - Lot input accepts unsafe integers.** `parseLots2` checks `Number.isInteger` but not
   `Number.isSafeInteger` or the declared domain bound, so sufficiently large valid-looking input
   breaks the exact-integer money guarantee.
5. **LOW - The current README test count is stale.** It reports 28 Playwright executions while the
   verified current gate runs 29.

## Overall Verdict

This is a strong, compact automation showcase. The core is deterministic, the test pyramid is
right-way-up, the Screenplay journey is readable, CI is currently green, the dependency audit is
clean, and the previous review cycle is fully reconciled. No HIGH risk was found. The four MEDIUM
items are bounded hardening work, not evidence that the suite is currently failing.

## Navigation Guide

Portfolio reviewers can start with the [Executive Summary](01_EXECUTIVE_SUMMARY.md) and
[Project Review](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md). Maintainers should read
[Risks and Issues](02_RISKS_AND_ISSUES.md), then use [Recommendations](05_RECOMMENDATIONS.md) and
[Migration Plans](07_MIGRATION_PLANS.md). Validation details and unattended questions are in the
[Metrics Annex](ANNEX/METRICS.md).

---

[Next: Executive Summary ->](01_EXECUTIVE_SUMMARY.md)
