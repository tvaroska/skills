---
description: Show top 3 open tasks from TODO.md, prioritized by Sprint 0 first
argument-hint:
---

# Show Open Tasks

Show the top 3 open tasks from TODO.md in the current directory.

## Steps

1. **Read TODO.md** in the current directory. If no TODO.md exists, inform user and suggest `/setup`.

2. **Extract all unchecked tasks** — lines matching `- [ ]`

3. **Separate by sprint:**
   - Sprint 0 tasks (always-active critical lane)
   - Current sprint tasks

4. **Sort Sprint 0 by severity:** P0 > P1 > P2

5. **Display top 3** in priority order (Sprint 0 first, then current sprint):

```
Top 3 Open Tasks:

{priority} {Task-ID} ({Sprint} - {Severity}): {Description} ({Effort})
  Files: {files}
  {Dependencies if any}

{Sprint} — {N} open tasks total
```

Priority indicators:
- `[P0]` for Sprint 0 P0 (critical)
- `[P1]` for Sprint 0 P1 (high)
- `[P2]` for Sprint 0 P2 (medium)
- `[--]` for current sprint tasks

## Staleness Warnings

After the task list, check for and display warnings:

- **Sprint age:** Parse the "Last Updated" date in TODO.md. If more than 14 days ago: "Sprint has been active for {X} days (cadence: 14 days)"
- **Completed task accumulation:** Count `- [x]` lines in TODO.md. If more than 5: "{N} completed tasks need archiving — run /replan"
- **Old P0 tasks:** For any Sprint 0 P0 task with an "Added:" date older than 3 days: "S0-{ID} (P0) has been open for {X} days"

## If No Open Tasks

```
All tasks complete! Run /replan to start the next sprint.
```
