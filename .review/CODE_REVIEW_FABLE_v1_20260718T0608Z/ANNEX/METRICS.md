# Annex - Metrics and Validation Evidence

[<- Back to Index](../00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md)

**Reviewer:** AI assistant (Claude Fable 5)

This annex records the commands actually run during the review and their results, so every
quantified claim elsewhere is traceable. Local environment: Windows 11, Node v20.19.5,
npm 10.8.2 (the repo's CI runs Node 24; `engines` requires `>=20`).

## Validation gate - `npm run verify`

Resolved per the registry row and `package.json` (`typecheck && test && test:e2e`). Run
locally against `main` @ `3fdfbf2`. **Result: PASS.**

- `tsc --noEmit` (strict): clean, no errors.
- `vitest run`: **90 passed / 90** across 11 test files (~2.4s test time).
- `playwright test`: **28 passed / 28** using 4 workers, ~3.8 min. Breakdown:
  - `chromium-desktop`: 16 tests (login, watchlist, order, close, responsive, smoke).
  - `mobile-pixel` (Pixel 7, Chromium/Android, touch): 6 tests.
  - `mobile-iphone` (iPhone 14, WebKit/iOS, touch): 6 tests.

This confirms the README/backlog claim of "90 unit tests + 28 Playwright executions"
exactly. No sibling-tree build was involved (this project's gate is self-contained), so
the registry coupling caveat about reviewing static source in place of a sibling build did
not apply here - the gate was run in full.

## Dependency, security, and licence pass

- `npm audit`: **found 0 vulnerabilities.**
- `npm outdated`: `typescript` 5.9.3 (latest 7.0.2), `vite` 7.3.6 (latest 8.1.5);
  `@playwright/test` and `vitest` current. All within-range; no security-driven upgrade
  needed (audit clean).
- Installed toolchain versions (from `package-lock.json`, lockfileVersion 3):
  `@playwright/test` 1.61.1, `typescript` 5.9.3, `vite` 7.3.6, `vitest` 4.1.10.
- **Runtime dependencies: none** - the shipped app has zero `dependencies`; all four are
  `devDependencies` (toolchain). Minimal supply-chain surface.
- **Licence:** MIT present at [LICENSE](../../LICENSE) (Copyright 2026 Gary Brooks),
  declared in [package.json](../../package.json) line 7. Consistent.
- **Secrets scan:** no committed tokens/keys/credentials found in `src/` or `tests/`; the
  app has no real auth and no external endpoints.

## Test-count detail (source of the coverage numbers)

Unit test counts per file (via `it(`/`test(` occurrences):
boundaries 9, feed 12, layout 2, meta 2, orderPanel 2, pnl 17, portfolio-close 6,
portfolio 6, session 7, ticker 3, validate 9 = **75 `it/test` declarations** expanding to
90 executed cases (several are parametrised `.each`/loop tables). E2E: close 2, login 3,
order 3, responsive 3, smoke 1, watchlist 4, mobile/breakpoints 3, mobile/journeys 3;
mobile files run on two device projects, yielding 16 desktop + 12 mobile = 28 executions.

## Repository state at review

- Branch: `main`; HEAD `3fdfbf2` (Merge PR #16, MF-14 close-out).
- Working tree: clean before review artefacts were added.
- No coverage tooling configured (`vitest --coverage` not wired); counts above are test
  cases, not line coverage. A c8 report is recommended (see Recommendations) to
  substantiate the "pure core fully covered" narrative quantitatively.

## Note on unattended questions

This review was produced unattended. The prompt's guidance to "ask the user" was not
actioned interactively; the one point that would normally be a question is recorded here
and in the findings rather than blocking:

- **Q (R-1 remediation preference):** escape-helper vs `textContent` for the email/error
  rendering - both are one-line fixes; recommendation is `textContent` for the email and a
  shared `escapeHtml` for any future non-literal interpolation. No blocker; recorded for
  the owner's decision.

---

[<- Back to Index](../00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md)
