---
description: Agency-style review of a premium-priced deliverable → FEEDBACK.md + Sprint 0 tasks
argument-hint: Optional focus area or repo name (multi-repo)
---

# Feedback — Agency Review

This repository was developed by an untested, high-cost agency asking a **premium
price** for their work. Review the project's status, documentation, and architecture
as a demanding client would. Consolidate the assessment into `FEEDBACK.md` and turn
the gaps into an actionable Sprint 0 plan.

**Be direct, but fair.** The agency charges premium prices; they should deliver
exceptional work. Praise what is genuinely excellent; do not soften real gaps.

Focus / scope: $ARGUMENTS

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: if `$ARGUMENTS` names a repo, review that one;
     otherwise AskUserQuestion which repo (or "all").
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: review current repo.
   - If neither → **single-repo mode**: review current directory.
2. Resolve `{target-dir}` per repo in scope.

## Phase 1: Review the deliverable

Read what exists in `{target-dir}/` and judge it against a premium standard:
- **spec/** — are requirements, CUJs, standards, and contracts complete and
  coherent, or hand-wavy?
- **design/** — is the architecture sound, documented, and actually followed?
  Check `architecture.md`, `seams.md`, `patterns.md`, `decisions/*.md`.
- **docs/** — roadmap, runbooks, testing: is the project operable by someone else?
- **Code & tests** — does it work, is it tested, is it maintainable? Reuse
  `/code-review` and `/security-review` for code-level depth where useful.
- `DECISIONS.md`, `CRITICAL.md`, `TODO.md` — is the project's own hygiene in order?

Assess: completeness, quality, testing rigor, documentation, architecture,
security, and whether the work justifies a premium price.

## Phase 2: Write FEEDBACK.md

Write `{target-dir}/FEEDBACK.md` (committed). Structure:

```markdown
# Project Feedback

**Reviewed:** {today's date}
**Verdict:** {one-line overall assessment — does the work justify a premium price?}

## What's Excellent
- {genuinely strong work — be specific}

## What Falls Short
- {gap} — {why it matters at a premium price} — {evidence: file/path}

## Documentation
- {assessment of spec/ + design/ + docs/}

## Architecture
- {assessment}

## Testing & Verification
- {assessment — do CUJs have Driver/Judge? is acceptance actually exercised?}

## Bottom Line
{direct, fair summary}
```

## Phase 3: Turn gaps into a Sprint 0 plan

Add the actionable gaps to the Sprint 0 section of `{target-dir}/TODO.md` as a
**two-level numbered structure (category, then item)**. Use lowercase-feature IDs
`S0-<feature>-<seq>`:
- `arch` architecture · `docs` documentation · `sec` security · `bug` correctness ·
  `debt` technical debt · `perf` performance · `infra` infrastructure.
- Draw each sequence from the `<!-- Counters: ... -->` comment (increment and
  rewrite it), or scan for the highest existing `S0-<feature>-N` if absent.
- Order by severity (P0 → P1 → P2).

```
- [ ] **S0-<feature>-<seq>**: {gap → concrete action} ({P0|P1|P2}, {effort})
      Files: {paths}
      Added: {today's date}
```

If a gap touches a path in `CRITICAL.md`, note that it auto-escalates.

## Report

```
Feedback review complete — {repo context line if multi-repo}

Verdict: {one-liner}
Written: {target-dir}/FEEDBACK.md
Added to Sprint 0: {count} tasks across {categories}

Next: /open to prioritize, /implement <id>, or /replan
```
