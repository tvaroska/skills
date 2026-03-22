---
description: Show project planning status summary
argument-hint:
---

# Project Status

Show a comprehensive status summary of the current project's planning state.

## Steps

1. **Read TODO.md.** If not found, inform user and suggest `/setup`.

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

## Output

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
