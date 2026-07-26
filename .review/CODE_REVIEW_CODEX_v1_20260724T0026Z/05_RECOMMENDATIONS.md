# Recommendations

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (Codex GPT-5)

## Recommended Refactors

- **P1 - Gate deployment on verification (R-1).** Make the deployed SHA conditional on the canonical
  audit/typecheck/lint/unit/E2E gate, while preserving deploy-job least privilege.
- **P1 - Own the local preview server (R-2).** Disable unconditional local reuse for `npm run verify`;
  provide an explicit opt-in configuration for interactive development.
- **P1 - Decide and enforce reload semantics (R-3).** Either persist versioned Portfolio state or
  document/test that reload intentionally resets activity while retaining identity.
- **P1 - Bound lot input (R-4).** Enforce safe integer plus a business maximum at HTML, parser, and
  domain-validation boundaries.
- **P2 - Make the tick snapshot atomic and add a JPY SELL integration case (R-5/R-6).**

## Next Steps

- Reconcile `docs/backlog.md` with these approved findings as a new review-remediation phase; do not
  rewrite closed historical MF/TRIAGE entries.
- Correct the current README count from 28 to 29 and align design FR-3 with the accepted no-margin MVP
  model (R-8).
- Align the Node engine declaration with Vite's actual lower bound and document the recommended local
  Node version (R-7).
- Add a coverage provider only if the project wants to claim numerical line/branch coverage; otherwise
  continue describing 90 as executed test cases, not source coverage.
- Preserve the current strengths: seeded data, built-artifact testing, zero runtime dependencies,
  strict lint/typecheck, focused mobile geometry, and independent unit oracle.

## Future Project Ideas

- Add the optional axe-core pass against login and the populated trading shell; treat findings as
  accessibility evidence rather than increasing E2E count for its own sake.
- Add visual baselines only for stable responsive shell/layout states, not tick-dependent financial
  text.
- Pursue native Flutter/Appium or Maestro only as an explicit Phase B credential with its own SUT and
  CI cost decision, as ADR-0001 already requires.
- If the demo grows beyond a vertical slice, introduce a versioned state repository interface before
  adding more persistence rather than spreading `localStorage` calls across UI code.

## Recorded Owner Questions

1. Should balance, open positions, and trade history survive reload, or is profile-only persistence
   with activity reset the intended demo contract? The review recommends documenting and testing
   either answer.
2. Should Pages deployment be hard-gated on the push verification workflow, or is pre-merge branch
   protection intentionally considered sufficient? The review recommends a hard same-SHA gate.

These questions did not block this unattended review and no implementation choice was made.

---

[<- Previous: Cross-Cutting Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
