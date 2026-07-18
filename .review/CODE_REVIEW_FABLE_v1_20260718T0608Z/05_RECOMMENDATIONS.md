# Recommendations

[<- Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (Claude Fable 5)

## Recommended Refactors (priority order)

- **Escape or `textContent` the email rendering** in
  [src/main.ts](../../src/main.ts) (line 104) and harden the error-list interpolation
  (R-1). Smallest change with the biggest credibility payoff on a public demo.
- **Extract a pair-aware `parsePricePts(pair, text)` + shared `gbp()`** into a
  `tests/support/` module and use it from
  [tests/screenplay/questions.ts](../../tests/screenplay/questions.ts),
  [tests/e2e/close.spec.ts](../../tests/e2e/close.spec.ts), and
  [tests/e2e/order.spec.ts](../../tests/e2e/order.spec.ts) (R-2).
- **Add ESLint (typescript-eslint + eslint-plugin-playwright) and fold `lint` into
  `verify`** (R-3).
- **Align the two workflows' action majors and add an `npm audit --audit-level=high`
  step** (R-4).
- **Derive `appVersion` from `package.json`** or delete it from
  [src/meta.ts](../../src/meta.ts) (R-6).

## Next Steps (immediate, low-effort)

- Add one README sentence stating the E2E lane's consistency-oracle trade-off (R-5).
- Add a self-XSS regression test (login with `<b>x</b>@x.co`, assert literal rendering)
  alongside the R-1 fix.
- Prune the four merged remote branches (`worklist/*`, `codex/mf-14-closeout`) per the
  portfolio TIDY convention.
- Add a one-line comment on `fullyParallel: false` in
  [playwright.config.ts](../../playwright.config.ts) (line 9) explaining what it does and
  does not serialise.

## Future Project Ideas (roadmap-consistent)

- **Accessibility lane (axe-core via `@axe-core/playwright`)** - already named in the
  backlog as portfolio gap B-4; the semantic markup makes this a small increment, and the
  sibling markdown-renderer's MR-09 lane provides a template.
- **Visual regression baselines** (`toHaveScreenshot`) for the three breakpoint layouts -
  backlog gap B-5; the deterministic feed makes stable screenshots unusually feasible if
  ticks are paused (a `?frozen=1` feed mode would help).
- **Phase B native layer** (Maestro or Appium against a Flutter or wrapped build) per
  ADR-0001, if a native-app credential is wanted - keep it a separate lane so the
  CI-clean web suite stays fast.
- **A USD/JPY E2E journey** - would exercise the JPY conventions end-to-end and force the
  R-2 fix (currently JPY is covered only at unit level).

---

[<- Previous: Cross-Cutting Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
