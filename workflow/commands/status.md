---
description: Show project planning status summary
argument-hint: Optional repo name to filter (multi-repo only)
---

# Project Status

Show a status summary of the project's planning state. Live status/counts come
ONLY from `TODO.md` — never from `spec/` or `design/` (those are status-free).

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: gather status from central + all registered subrepos
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: show only this repo's status
   - If neither → **single-repo mode**: show only current directory's status

2. **Repo filter:** If `$ARGUMENTS` contains a repo name, only show that repo's status.

## Steps (per repo)

For each repo in scope:

1. **Read TODO.md.** If not found, inform user and suggest `/setup` (or `/repos setup {dir}` in multi-repo).

2. **Gather metrics**, counting all three checkbox states:
   - Current sprint number and theme
   - Sprint 0: count open (`- [ ]`) tasks by severity (P0/P1/P2)
   - Current sprint: count open (`- [ ]`) vs done (`- [x]`)
   - **Failed (`- [!]`): count across Sprint 0 + current sprint** — these were
     attempted and abandoned, and need a retry via `/implement`.
   - "Last Updated" date and days since

3. **Read docs/roadmap.md** (if exists): feature areas with status indicators, overall progress.

4. **Read docs/features/*.md** (if exists): count total completed tasks; list the last 5 completions.

Note the layout: requirements live in `spec/` and how-it's-built in `design/`
(both status-free — do not derive counts from them); planning/ops and the
completed-work archive live in `docs/`.

## Output — Single-Repo / Subrepo

```
Project Status: {project name from TODO.md header}
Last Updated: {date} ({N} days ago)

Sprint 0 (Critical):
  P0: {N} open | P1: {N} open | P2: {N} open

Sprint {N}: {Theme}
  {completed}/{total} tasks ({percent}% complete)

Needs retry: {M} failed task(s) [!]   (omit line if zero)

Feature Areas:
  {area}: {status} {percent}%

Recent Completions:
  - {task-id}: {description} ({date})

Suggested Actions:
  {context-dependent: /open, /implement {failed-id} to retry, /replan, /new-task}
```

## Output — Multi-Repo (Central)

```
Workspace Status
================

Repo         Sprint 0 (P0/P1/P2)   Current Sprint          Failed   Last Updated
──────────────────────────────────────────────────────────────────────────────
[central]    P0=0  P1=1  P2=0       Sprint 2: 3/5 (60%)     0        2d ago
[api]        P0=1  P1=0  P2=2       Sprint 2: 2/4 (50%)     1        1d ago
[frontend]   P0=0  P1=0  P2=1       Sprint 2: 1/3 (33%)     0        5d ago
──────────────────────────────────────────────────────────────────────────────
TOTAL        P0=1  P1=1  P2=3       6/12 (50%)              1

Critical Alerts:
  [api] S0-sec-1 (P0) has been open for 4 days
  [api] S2-be-2 (!) attempted but failed — /implement S2-be-2 to retry
  [frontend] Sprint has been active for 16 days (cadence: 14 days)

Recent Completions (across all repos):
  - [central] S2-coord-1: Sync API contracts (2026-08-19)
  - [api] S2-be-3: Add rate limiting (2026-08-18)

Suggested Actions:
  /open — see top priorities (and retry candidates) across all repos
  /repos — manage subrepo registry
  /status {repo} — detailed status for a specific repo
```
