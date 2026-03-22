---
description: Sprint transition — close current sprint and start the next one
argument-hint:
---

# Replan — Sprint Transition

Transition from the current sprint to the next. This command handles sprint boundaries only — task archiving is handled by `/implement` on completion.

## Pre-check

1. Read TODO.md. If no TODO.md exists, inform user and suggest `/setup`.

2. Check for unarchived completed tasks (`- [x]` still in TODO.md):
   - If found, archive them first (move to appropriate `docs/features/*.md` files, remove from TODO.md)
   - This is a safety net — normally `/implement` archives on completion

## Understand Priorities

3. Use AskUserQuestion: "What should the next sprint focus on?"
   - Read `docs/roadmap.md` (if exists) to suggest options based on strategic priorities
   - Read `docs/features/*.md` planned work sections for candidates
   - Present options to user

## Sprint Transition

4. **Update TODO.md:**
   - Update "Last Updated" date
   - Remove completed sprint section (if empty after archiving)
   - Rename "Sprint N+1 Preview" to current sprint (if exists)
   - Create new sprint section based on user priorities:
     ```
     ## Sprint {N+1}: {Theme}

     (tasks to be added with /new-feature or manually)
     ```
   - Keep Sprint 0 with only open tasks

5. **Update docs/roadmap.md** (if exists):
   - Update feature area statuses and completion percentages
   - Adjust priorities based on user input
   - Update "Last Updated" date

## Report

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
