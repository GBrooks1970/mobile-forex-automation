<!--
  AUDIENCE: Engineers and AI agents reviewing development session history.
  PURPOSE:  Record what was built, what was decided, what broke, and what was learned
            during a development session. Immutable once written — append only.
  LOCATION: docs/implementation-logs/YYYY-MM-DD_[topic].md
  TEMPLATE: docs/templates/implementation-log.template.md
-->

# [REQUIRED: Topic / Feature / Refactor Title] — [REQUIRED: YYYY-MM-DD]

## Session Summary

[REQUIRED: 2–4 sentences. What was the goal? What was achieved? What is the resulting state?]

---

## Objectives

[REQUIRED: Numbered list of what this session set out to do. Mark each as complete or deferred.]

1. ✅ / ❌ / ⏸️ [Objective 1]
2. ✅ / ❌ / ⏸️ [Objective 2]
3. [Add as needed]

---

## Test Results

[REQUIRED if tests were run: Before/after comparison. Omit section if no tests were executed.]

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| [STACK_NAME] | [Unit / E2E] | [N/N] | [N/N] | ✅ PASS / ❌ FAIL |

---

## Changes Implemented

[REQUIRED: One subsection per logical change. Include file paths and brief code context where non-obvious.]

### [REQUIRED: Change 1 — descriptive title]

**Files changed:**
- `[path/to/file.ext]` — [what changed and why]

### [REQUIRED: Change 2 — descriptive title]

[Repeat as needed]

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| [decision] | [why] | [what was considered] |

---

## Documentation Updates

- `[path/to/doc.md]` — [what was updated]

---

## Lessons Learned

- [lesson 1]
- [lesson 2]

---

## Recommendations / Next Steps

- [ ] [action 1] — [owner / priority]
- [ ] [action 2]

---

*Session logged: [REQUIRED: YYYY-MM-DD]. Author: [REQUIRED: name or agent identifier].*
