---
description: Show project planning status summary
argument-hint: Optional repo name to filter (multi-repo only)
---

# Project Status

Show a comprehensive status summary of the current project's planning state.

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: gather status from central + all registered subrepos
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: show only this repo's status
   - If neither → **single-repo mode**: show only current directory's status

2. **Repo filter:** If `$ARGUMENTS` contains a repo name, only show that repo's status.

## Steps (per repo)

For each repo in scope (single repo, or all repos in multi-repo mode):

1. **Read TODO.md.** If not found, inform user and suggest `/setup` (or `/repos setup {dir}` in multi-repo).

2. **Gather metrics:**
   - Current sprint number and theme
   - Sprint 0: count open tasks by severity (P0/P1/P2)
   - Current sprint: count open vs completed tasks
   - "Last Updated" date and days since

3. **Read docs/roadmap.md** (if exists):
   - List feature areas with their status indicators
   - Overall progress

4. **Read docs/features/*.md** (if exists):
   - Count total completed tasks across all feature files
   - List recently completed work (last 5 entries)

## Output — Single-Repo / Subrepo

```
Project Status: {project name from TODO.md header}
Last Updated: {date} ({N} days ago)

Sprint 0 (Critical):
  P0: {N} open | P1: {N} open | P2: {N} open

Sprint {N}: {Theme}
  {completed}/{total} tasks ({percent}% complete)

Feature Areas:
  {area}: {status} {percent}%
  {area}: {status} {percent}%

Recent Completions:
  - {task-id}: {description} ({date})
  - {task-id}: {description} ({date})

Suggested Actions:
  {context-dependent suggestions: /open, /replan, /new-task, etc.}
```

## Output — Multi-Repo (Central)

```
Workspace Status
================

Repo         Sprint 0 (P0/P1/P2)   Current Sprint          Last Updated
─────────────────────────────────────────────────────────────────────────
[central]    P0=0  P1=1  P2=0       Sprint 2: 3/5 (60%)     2d ago
[api]        P0=1  P1=0  P2=2       Sprint 2: 2/4 (50%)     1d ago
[frontend]   P0=0  P1=0  P2=1       Sprint 2: 1/3 (33%)     5d ago
─────────────────────────────────────────────────────────────────────────
TOTAL        P0=1  P1=1  P2=3       6/12 (50%)

Critical Alerts:
  [api] S0-SEC-1 (P0) has been open for 4 days
  [frontend] Sprint has been active for 16 days (cadence: 14 days)

Recent Completions (across all repos):
  - [central] S2-COORD-1: Sync API contracts (2025-03-20)
  - [api] S2-BE-3: Add rate limiting (2025-03-19)

Suggested Actions:
  /open — see top priorities across all repos
  /repos — manage subrepo registry
  /status {repo} — detailed status for a specific repo
```
