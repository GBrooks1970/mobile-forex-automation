# Migration Plans

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Metrics Annex ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (Codex GPT-5)

These are bounded remediation plans, not proposals to replace the project's successful architecture.

## Plan 1 - Single Source of Truth for Features and Account State

- Record the owner decision for reload semantics: profile-only persistence with a documented reset, or
  durable balance/open/history state.
- Align design FR-3, the traceability matrix, backlog maintenance notes, and README with the accepted
  paper-trading money model.
- If state is ephemeral, add one explicit E2E proving and naming the reload reset; avoid implying
  durable account history.
- If state is durable, introduce one versioned serialised state type plus a repository interface,
  validate all loaded fields, restore deterministic counters, and save only after successful state
  transitions.
- Keep `docs/backlog.md` as status source of truth and add new review-remediation items without editing
  historical delivery claims.
- Update only current test-count claims to 29; retain dated 28-execution history where it describes the
  earlier phase accurately.

## Plan 2 - Docker Compose for Local Development

N/A - the product is a static Vite artifact with no backend, database, broker, or service dependency.
Docker Compose would add startup and maintenance cost without improving parity. Playwright should own a
fresh `vite preview` process directly during the gate.

## Plan 3 - GitHub Actions and Deployment Gate

- Choose a same-SHA gating design: reusable workflow/job, verification inside Pages, or successful-CI
  `workflow_run` with explicit head-SHA validation.
- Keep pull-request Pages builds as artifact-path validation, but do not upload/deploy on PRs.
- Preserve least-privilege global permissions and keep `pages: write`/`id-token: write` only on the
  deployment job.
- Ensure the deploy job cannot begin until audit, typecheck, lint, unit, and E2E have succeeded for the
  exact commit being published.
- Retain failure-only Playwright report upload and add a clear failure policy for early failures where
  no report directory exists.
- Validate the revised workflow on a PR, then inspect both verification and Pages conclusions for the
  same merge SHA before closing the remediation item.
- Document local parity as `npm ci`, browser install, and `npm run verify`, with Playwright server reuse
  disabled for the gate.

## Plan 4 - Numeric and Integration Hardening

- Define the maximum supported lot size from the product/data model rather than from JavaScript's
  numerical ceiling.
- Enforce that limit plus `Number.isSafeInteger` in parser and domain validation.
- Add unit boundaries at maximum, maximum + 0.01, unsafe integer, malformed input, and zero.
- Convert the watchlist replay read into one atomic in-page snapshot.
- Add one USD/JPY SELL desktop journey; reuse the shared pair-aware parser and do not multiply the
  Pixel/iPhone matrix.
- Run `npm run verify`, the focused replay repeat probe, and `npm audit --audit-level=high` before the
  remediation PR is proposed for merge.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Metrics Annex ->](ANNEX/METRICS.md)
