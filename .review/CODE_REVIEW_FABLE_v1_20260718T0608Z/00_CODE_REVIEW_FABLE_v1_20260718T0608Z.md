# Code Review: mobile-forex-automation

**Reviewer:** AI assistant (Claude Fable 5)
**Date:** 2026-07-18T06:08Z
**Scope:** Full single-repository review (first portfolio review of this project)
**Repository state:** `main` @ `3fdfbf2` (clean tree)
**Status source of truth:** [docs/backlog.md](../../docs/backlog.md) (v5, MF-01..MF-14 complete, 0 outstanding)

## Table of Contents

1. [Executive Summary](01_EXECUTIVE_SUMMARY.md)
2. [Risks and Issues](02_RISKS_AND_ISSUES.md)
3. [Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)
4. [Cross-Cutting Analysis](04_CROSS_PROJECT_ANALYSIS.md)
5. [Recommendations](05_RECOMMENDATIONS.md)
6. [Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md)
7. [Migration Plans](07_MIGRATION_PLANS.md)
8. [Annex: Metrics and Validation Evidence](ANNEX/METRICS.md)

## Structure Summary

This is a single-repository review, so the template's single-repo customisation applies:
`03_PROJECT_REVIEWS/` carries one file (`PROJECT_001_mobile-forex-automation.md`), and
`04_CROSS_PROJECT_ANALYSIS.md` is a cross-cutting analysis *within* the repo (SUT vs unit
suite vs E2E suite vs Screenplay layer vs CI vs documentation). Sections that genuinely do
not apply are kept as headings with an `N/A` justification rather than padded.

The review was evidence-gathered from the working tree at `3fdfbf2` and validated by running
the project's registry gate `npm run verify` locally (green: typecheck + 90 unit + 28 E2E)
plus `npm audit` (0 vulnerabilities). See the [Annex](ANNEX/METRICS.md) for the run evidence.

## Key Findings

1. **MEDIUM - Unsanitised user-controlled email interpolated into `innerHTML`**
   ([src/main.ts](../../src/main.ts) line 104): the login email regex admits `<`/`>`
   payloads, giving a (self-)XSS surface in the demo SUT. See
   [02_RISKS_AND_ISSUES.md](02_RISKS_AND_ISSUES.md) R-1.
2. **MEDIUM - Pair-unaware `toPts` price parser duplicated in three test files**
   (hard-coded 5-decimal scaling): a latent oracle bug that would silently misparse any
   future JPY-quoted E2E journey. R-2.
3. **MEDIUM - No lint/format gate**: `npm run verify` is typecheck + tests only; the repo
   ships no ESLint/Prettier config, unlike the portfolio's stronger repos. R-3.
4. **LOW - CI workflow action-version drift** between `ci.yml` (checkout@v5/setup-node@v5)
   and `pages.yml` (checkout@v7/setup-node@v6), and no scheduled `npm audit` in CI. R-4.
5. **Strengths:** deterministic replay-oracle E2E design (seeded feed + `data-seq`
   contract), integer-only money arithmetic with a pinned PRS oracle, genuine touch-first
   mobile device projects (Pixel 7 Chromium + iPhone 14 WebKit), tests run against the
   built artefact Pages ships, and documentation that matches the code (all backlog claims
   verified locally).

Overall verdict: a healthy, honest, well-evidenced mobile-web automation showcase with
no HIGH findings. The suite is deterministic by construction and the gate is green.

## Navigation Guide

- Read [01_EXECUTIVE_SUMMARY.md](01_EXECUTIVE_SUMMARY.md) first for the shape of the repo.
- [02_RISKS_AND_ISSUES.md](02_RISKS_AND_ISSUES.md) is the ranked findings list (each with
  evidence, impact, and remediation).
- [03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)
  is the layer-by-layer walkthrough.
- [06_ARCHITECTURE_ASSESSMENT.md](06_ARCHITECTURE_ASSESSMENT.md) assesses the repo against
  Test Pyramid / SOLID / KISS / YAGNI / ISTQB and its pedagogical value.
- The [Annex](ANNEX/METRICS.md) holds the verified metrics (test counts, run results,
  audit output) so claims in the other files are traceable.

---

[Next: Executive Summary ->](01_EXECUTIVE_SUMMARY.md)
