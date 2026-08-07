# Migration Strategy and Plans

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260807T1410Z.md) | [Next: Annex Metrics ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (Claude)

## 1. Single Source of Truth for Features & Domain Rules

- **Current State:** Domain rules (integer money scheme, P&L formulas, lot limits) are documented in `docs/design-document.md` and enforced in `src/core/`. Versioning is aligned across `package.json`, `src/meta.ts`, and `docs/backlog.md`.
- **Target State:** Maintain automated synchronization between domain validation rules and specification documentation.
- **Execution Plan:**
  1. Continue using `package.json` as the single source of truth for versioning.
  2. Maintain `docs/backlog.md` as the canonical project history and roadmap source of truth.
  3. Ensure any future domain rule modifications update `docs/design-document.md` and `src/core/` simultaneously.

## 2. Containerisation & Local Execution Strategy

- **Current State:** SUT dev server (`vite`) and Playwright E2E suite run directly on the host machine using Node.js 20/24 and Playwright browser binaries.
- **Target State:** Optional Docker containerisation for zero-dependency local execution across diverse developer workstations.
- **Execution Plan:**
  1. Create a minimal multi-stage `Dockerfile` using `node:24-alpine` to build and serve the static Vite application.
  2. Create a `docker-compose.yml` defining the SUT web service on port 4173.
  3. Add npm scripts (`docker:build`, `docker:up`) to support containerised execution for developers without local Node/Playwright setups.

## 3. GitHub Actions & CI/CD Pipeline Maturity

- **Current State:** `.github/workflows/ci.yml` provides a unified Node 24 job graph performing typechecking, linting, dependency auditing, server-ownership probing, unit testing, E2E testing, and conditional Pages deployment.
- **Target State:** Enhanced workflow parallelisation and automated security scanning.
- **Execution Plan:**
  1. Introduce parallel matrix execution for Playwright desktop vs mobile browser projects in CI if suite execution time grows.
  2. Integrate CodeQL or Snyk static security analysis actions into the PR pipeline.
  3. Retain least-privilege token permissions (`contents: read`, `pages: write`, `id-token: write`) on deployment jobs.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260807T1410Z.md) | [Next: Annex Metrics ->](ANNEX/METRICS.md)
```

---