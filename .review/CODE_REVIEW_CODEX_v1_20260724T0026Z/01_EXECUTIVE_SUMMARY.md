# Executive Summary

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Risks and Issues ->](02_RISKS_AND_ISSUES.md)

**Reviewer:** AI assistant (Codex GPT-5)

## Overall Summary

Mobile Forex Automation succeeds at its stated purpose: it is an honestly labelled mobile-web
automation showcase, backed by a deliberately small deterministic SUT rather than a pretend native
credential. The review found no HIGH risks. The canonical `npm run verify` gate passed with strict
typecheck and lint, 90 Vitest tests, and 29 Playwright executions across desktop Chromium, Pixel 7,
and iPhone 14 projects. `npm audit --audit-level=high` also reported zero vulnerabilities.

The project is not "finished beyond review", despite a closed roadmap. Deployment gating, local E2E
server ownership, persistence semantics, and numeric input bounds deserve a small follow-on cycle.
These are credible second-review findings rather than regressions from the first review: the prior
TRIAGE-01..06 work is present and effective.

## Design Quality

- Strong separation between the pure domain core, deterministic feed, timing owner, mutable
  application state, string-rendered UI, and test layers.
- Injected storage, clocks, and scheduler seams keep unit tests fast and remove unnecessary I/O.
- The chosen Playwright device-emulation approach is proportionate, CI-friendly, and accurately
  described as mobile web rather than native automation.
- Deployment is architecturally separate from verification but not gated by it, creating the most
  important operational gap in the repository.
- Persistence is split between `localStorage` identity data and in-memory trading state without an
  explicit product rule for what reload should retain.

## Code Quality

- TypeScript strictness, type-aware ESLint, zero runtime dependencies, small modules, and explanatory
  comments make the code easy to inspect.
- Integer points, lots in hundredths, and pence avoid routine floating-point money errors; the PRS
  worked example is pinned independently in the unit lane.
- `parseLots2` does not enforce safe-integer or domain maxima, leaving one input path able to escape
  the otherwise careful exact-integer design.
- Closed history rows are frozen and state transitions are deterministic, but account activity is
  not serialised with the persisted profile.
- Dynamic HTML inputs added since the previous review are escaped, and the crafted-email regression
  test demonstrates that remediation.

## Main Highlights

- The full local gate passed: 11 unit files/90 cases and 29 E2E executions, including WebKit-backed
  iPhone emulation and Chromium-backed Pixel touch journeys.
- Per-pair seeded PRNG streams and one ticker owner produce unusually strong replayable UI evidence.
- The P&L suite applies boundary-value analysis, equivalence partitioning, direction partitions,
  JPY/non-JPY partitions, exact-half rounding, and state-transition tests.
- Current `main` CI and Pages runs were both verified as successful for `d5fb448`.
- The previous review's injection, pair-parser, lint, audit, documentation, and duplication findings
  have all been addressed and reconciled in the backlog.

## Pedagogical Value

- Excellent for teaching why deterministic test data matters more than arbitrary waits in dynamic UI
  automation.
- The compact Actor/Ability/Task/Question implementation is approachable for a mid-level engineer,
  while still showing useful Screenplay vocabulary.
- Comments explain calculation derivations and race-avoidance intent, not merely syntax.
- The repository would teach local gate integrity better if it owned the preview server unconditionally
  during verification and made the non-atomic watchlist snapshot atomic.
- A single JPY SELL integration example would make the equivalence-partition story visible end to end,
  rather than leaving it mostly in unit tests.

## Backlog Alignment

`docs/backlog.md` correctly records MF-01..MF-14 and TRIAGE-01..06 as complete, and the review found
no hidden `test.skip`, `test.fixme`, quarantine tag, or required deferred scenario. Optional native
Phase B, accessibility, and visual regression remain explicitly beyond the delivered MVP. The
roadmap can remain closed, but the findings in this review are reasonable candidates for a new
review-remediation phase after owner approval.

---

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Risks and Issues ->](02_RISKS_AND_ISSUES.md)
