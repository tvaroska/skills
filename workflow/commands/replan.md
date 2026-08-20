---
description: Sprint transition — run the CUJ verification suite, then close the sprint and start the next
argument-hint: Optional repo name (multi-repo only)
---

# Replan — Sprint Transition

Close the current sprint and open the next. Per-task archiving is handled by
`/implement`; this command owns the sprint boundary AND the **T3 gate**: the CUJ
verification suite must pass before a sprint is allowed to transition.

Keep live status/counts in `TODO.md` only — never write counts into `spec/` or
`design/` (those stay status-free).

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: ask scope (below)
   - If not found → parent has `.repos.json` → **inside subrepo**: replan only this repo
   - Neither → **single-repo mode**: replan current directory

2. **Scope selection (central only):**
   - If `$ARGUMENTS` contains a repo name, replan only that repo.
   - Otherwise AskUserQuestion: "Which repos should transition?"
     - **All repos** · **Central only** · **Specific repo** (list registered names)

## Pre-check

For each repo in scope:

1. Read `{target-dir}/TODO.md`. If none, inform user and suggest `/setup` (or `/repos setup {dir}`).

2. **Unarchived completed tasks** (`- [x]` still in TODO.md): archive them first
   (substance → `{target-dir}/docs/features/*.md` + a `DECISIONS.md` entry, then
   remove from TODO.md). Safety net — normally `/implement` already did this.

3. **Blocking check on failed tasks** (`- [!]`): list them. A sprint with
   attempted-but-failed work is not cleanly closable — flag them and ask whether
   to retry (`/implement {id}`), carry them into the next sprint, or accept and
   proceed. Do not silently drop them.

## T3 Gate — CUJ Verification Suite (sprint-close)

Run BEFORE transitioning. This is the same logic `/verify` uses — invoke `/verify`
(all CUJs) for each repo in scope, or run its steps directly if invoking inline:

4. Read `{target-dir}/spec/cujs.md`. Determine which CUJs the closing sprint
   touched via each CUJ's `Supported By` map (the sprint's completed task IDs /
   feature areas); run the full suite if unsure.

5. For each in-scope CUJ, run its **`Driver:`** end-to-end (per-repo, whichever
   the repo provides — a code e2e harness OR an LLM-agent sim; no forced rewrite),
   then apply BOTH judges, both of which must pass:
   - **Deterministic must-pass:** state assertions + optional weighted trace
     score + hard-fail traps (a tripped trap caps the score at 0).
   - **External LLM judge via `jeep`** against the CUJ `Success Criteria` rubric:
     `jeep --schema rubric.json --system "<grader>" "grade this run" -f criteria.txt -f run_output.txt --format json`
     (`jeep` must be on PATH; the workflow owns the rubric + aggregation + pass/fail).

6. **If any CUJ fails either judge:** do NOT transition. Report the failing CUJ(s)
   and evidence, and file the regression(s) as Sprint 0 task(s) via `/new-task`.
   Stop here for that repo.

## Understand Priorities

7. Only after the T3 gate passes, AskUserQuestion: "What should the next sprint focus on?"
   - Read `{target-dir}/docs/roadmap.md` (if any) for strategic options.
   - Read `{target-dir}/docs/features/*.md` planned-work sections for candidates.
   - In "all repos" mode, present per-repo priorities or ask for a shared theme.

## Sprint Transition

For each repo in scope:

8. **Update `{target-dir}/TODO.md`:**
   - Update "Last Updated" date.
   - Remove the completed sprint section (if empty after archiving).
   - Promote any "Sprint N+1 Preview" to the current sprint (if present).
   - Create the new sprint section:
     ```
     ## Sprint {N+1}: {Theme}

     (tasks to be added with /new-feature or /new-task)
     ```
   - Keep Sprint 0 with only its open (`- [ ]`) and any carried-over failed (`- [!]`) tasks.

9. **Update `{target-dir}/docs/roadmap.md`** (if exists): feature-area statuses,
   completion percentages, adjusted priorities, "Last Updated" date. Do NOT write
   status into `spec/` or `design/`.

## Report

### Single-repo / subrepo:

```
Sprint transition complete:

T3 CUJ verification: {K}/{K} passed
Previous: Sprint {N} ({theme}) — closed
Current:  Sprint {N+1} ({new theme})
Sprint 0: {N} open · {M} failed

Updated files:
- TODO.md
- docs/roadmap.md
- docs/features/{list}.md, DECISIONS.md (if any were archived)

Next: /open to see priorities, /new-feature to add work
```

### Multi-repo (all repos):

```
Sprint transition complete:

Repo          T3       Previous                Current
──────────────────────────────────────────────────────────────
[central]     3/3 ok   Sprint {N} ({theme})    Sprint {N+1} ({new theme})
[api]         2/2 ok   Sprint {N} ({theme})    Sprint {N+1} ({new theme})
[frontend]    1/1 ok   Sprint {N} ({theme})    Sprint {N+1} ({new theme})

Sprint 0 open tasks: {total} ({per-repo breakdown})

Next: /open to see priorities, /new-feature to add work
```

If the T3 gate blocked any repo, that repo stays on its current sprint and its
row shows the failing CUJ plus the Sprint 0 task filed for the regression.
