# MF-13 Pages deployment foundation — 2026-07-13

**Closed:** 2026-07-14

## Session Summary

Prepared the completed mobile-forex SUT for GitHub Pages without changing its local-development or
test URLs. GitHub Pages now uses the Actions publishing source, and the repository contains a
least-privilege workflow that validates the production build on pull requests and deploys only from
`main`.

---

## Objectives

1. ✅ Enable GitHub Pages with the GitHub Actions publishing source.
2. ✅ Emit production assets beneath `/mobile-forex-automation/` while retaining `/` locally.
3. ✅ Validate the Pages build on pull requests and deploy only trusted `main` commits.
4. ✅ Smoke-test the live URL and record it in public project metadata.

---

## Changes Implemented

- `vite.config.ts` reads `VITE_BASE_PATH`, defaulting to `/` for local development and Playwright.
- `.github/workflows/pages.yml` derives the configured Pages base path, builds on PRs and `main`,
  verifies the emitted asset prefix, uploads the production artifact only on `main`, and deploys
  with scoped Pages/OIDC permissions.
- Repository Pages settings use `build_type: workflow` with HTTPS enforced.
- `README.md`, `docs/backlog.md`, and repository metadata expose the verified live demo and record
  MF-13 as complete.

---

## Technical Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| Environment-driven Vite base | Preserves the root URL used by local preview/E2E while producing correct project-Pages URLs | Hard-coding the Pages sub-path for every environment |
| Build on PR; deploy only `main` | Makes deployment defects review-visible without publishing untrusted PR commits | Deploying every branch or discovering asset-path failures after merge |
| Separate build and deploy jobs | Keeps deployment permissions out of the build job and follows the Pages artifact model | A single broadly privileged job |

---

## Validation

- Production build with `VITE_BASE_PATH=/mobile-forex-automation/`.
- Emitted `dist/index.html` asset-prefix assertion.
- Full `npm run verify` gate.
- High-severity dependency audit and workflow diff checks.
- First `main` Pages run: artifact build, base-path assertion, upload, and deployment all passed.
- Public Chromium smoke (`?seed=20260714`): HTTP 200; login; GBP/USD order; deterministic price
  movement; manual close; history and balance update; zero console/page errors.

---

## Recommendations / Next Steps

- [x] Merge the Pages deployment PR and wait for the `main` Pages workflow.
- [x] Smoke-test login and the deterministic trading journey at the HTTPS Pages URL.
- [x] Add the verified live-demo link to the README and repository homepage, then close MF-13.
- [ ] Continue to MF-14 only after the Pages URL is proven.

---

*Session logged: 2026-07-13. Author: AI assistant (Codex).*
