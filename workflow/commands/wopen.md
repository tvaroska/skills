---
description: Show top 3 open tasks from TODO.md, prioritized by Sprint 0 first
argument-hint: Optional repo name to filter (multi-repo only)
---

# Show Open Tasks

Show the top 3 open tasks, prioritized by Sprint 0 first.

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: read TODO.md from current directory AND from each registered subrepo's directory
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: read only the current directory's TODO.md
   - If neither → **single-repo mode**: read only the current directory's TODO.md

2. **Repo filter:** If `$ARGUMENTS` contains a repo name, only show tasks from that repo (must match a name in `.repos.json` or "central").

## Steps

1. **Read TODO.md** file(s) based on context above. If no TODO.md exists (in single-repo or subrepo mode), inform user and suggest `/setup`.

2. **Extract all unchecked tasks** — lines matching `- [ ]` from each TODO.md

3. **Tag tasks with repo source** (multi-repo only):
   - Tasks from central TODO.md → tagged `[central]`
   - Tasks from `{repo}/TODO.md` → tagged `[{repo-name}]`

4. **Separate by sprint:**
   - Sprint 0 tasks (always-active critical lane) — from all repos
   - Current sprint tasks — from all repos

5. **Sort Sprint 0 by severity:** P0 > P1 > P2 (across all repos)

6. **Display top 3** in priority order (Sprint 0 first, then current sprint):

### Single-repo / subrepo output:

```
Top 3 Open Tasks:

{priority} {Task-ID} ({Sprint} - {Severity}): {Description} ({Effort})
  Files: {files}
  {Dependencies if any}

{Sprint} — {N} open tasks total
```

### Multi-repo (central) output:

```
Top 3 Open Tasks (all repos):

{priority} [{repo}] {Task-ID} ({Sprint} - {Severity}): {Description} ({Effort})
  Files: {files}
  {Dependencies if any}

Summary:
  [central]  — {N} open tasks
  [{repo1}]  — {N} open tasks
  [{repo2}]  — {N} open tasks
```

Priority indicators:
- `[P0]` for Sprint 0 P0 (critical)
- `[P1]` for Sprint 0 P1 (high)
- `[P2]` for Sprint 0 P2 (medium)
- `[--]` for current sprint tasks

## Staleness Warnings

After the task list, check for and display warnings (per repo in multi-repo mode):

- **Sprint age:** Parse the "Last Updated" date in TODO.md. If more than 14 days ago: "{repo}: Sprint has been active for {X} days (cadence: 14 days)"
- **Completed task accumulation:** Count `- [x]` lines in TODO.md. If more than 5: "{repo}: {N} completed tasks need archiving — run /replan"
- **Old P0 tasks:** For any Sprint 0 P0 task with an "Added:" date older than 3 days: "{repo}: S0-{ID} (P0) has been open for {X} days"

## If No Open Tasks

```
All tasks complete! Run /replan to start the next sprint.
```
