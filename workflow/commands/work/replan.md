---
description: Sprint transition — close current sprint and start the next one
argument-hint: Optional repo name (multi-repo only)
---

# Replan — Sprint Transition

Transition from the current sprint to the next. This command handles sprint boundaries only — task archiving is handled by `/implement` on completion.

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: ask scope (see below)
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: replan only this repo
   - If neither → **single-repo mode**: replan current directory

2. **Scope selection (central only):**
   - If `$ARGUMENTS` contains a repo name, replan only that repo
   - Otherwise, AskUserQuestion: "Which repos should transition to the next sprint?"
     - **All repos** — transition central + all subrepos together
     - **Central only** — transition only the central repo
     - **Specific repo** — list registered repo names as options

## Pre-check

For each repo in scope:

1. Read `{target-dir}/TODO.md`. If no TODO.md exists, inform user and suggest `/setup` (or `/repos setup {dir}`).

2. Check for unarchived completed tasks (`- [x]` still in TODO.md):
   - If found, archive them first (move to appropriate `{target-dir}/docs/features/*.md` files, remove from TODO.md)
   - This is a safety net — normally `/implement` archives on completion

## Understand Priorities

3. Use AskUserQuestion: "What should the next sprint focus on?"
   - Read `{target-dir}/docs/roadmap.md` (if exists) to suggest options based on strategic priorities
   - Read `{target-dir}/docs/features/*.md` planned work sections for candidates
   - In multi-repo "all repos" mode, present priorities per repo or ask for a shared theme
   - Present options to user

## Sprint Transition

For each repo in scope:

4. **Update `{target-dir}/TODO.md`:**
   - Update "Last Updated" date
   - Remove completed sprint section (if empty after archiving)
   - Rename "Sprint N+1 Preview" to current sprint (if exists)
   - Create new sprint section based on user priorities:
     ```
     ## Sprint {N+1}: {Theme}

     (tasks to be added with /new-feature or manually)
     ```
   - Keep Sprint 0 with only open tasks

5. **Update `{target-dir}/docs/roadmap.md`** (if exists):
   - Update feature area statuses and completion percentages
   - Adjust priorities based on user input
   - Update "Last Updated" date

## Report

### Single-repo / subrepo:

```
Sprint transition complete:

Previous: Sprint {N} ({theme}) — archived
Current: Sprint {N+1} ({new theme})
Sprint 0: {N} open tasks

Updated files:
- TODO.md
- docs/roadmap.md
- docs/features/{list}.md

Next: /open to see priorities, /new-feature to add work
```

### Multi-repo (all repos):

```
Sprint transition complete:

Repo          Previous                    Current
──────────────────────────────────────────────────────
[central]     Sprint {N} ({theme})        Sprint {N+1} ({new theme})
[api]         Sprint {N} ({theme})        Sprint {N+1} ({new theme})
[frontend]    Sprint {N} ({theme})        Sprint {N+1} ({new theme})

Sprint 0 open tasks: {total} ({per-repo breakdown})

Next: /open to see priorities, /new-feature to add work
```
