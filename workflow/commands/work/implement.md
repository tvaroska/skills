---
description: Implement a task from TODO.md, then archive it on completion
argument-hint: Task ID (e.g., S1-BE-3)
---

# Implement Task

Implement task `$ARGUMENTS` from TODO.md, then archive the completed task.

## Phase 1: Load Context

1. **Read TODO.md** to find task `$ARGUMENTS`:
   - Description, files to modify, dependencies, acceptance criteria
   - If task not found, inform user and run `/open`
   - If task has dependencies, check they are complete (`- [x]`). If blocked, inform user.

2. **Read project context** (if files exist):
   - `docs/cujs.md` — understand the user journey this task supports
   - `docs/specs.md` — requirements and acceptance criteria
   - `docs/architecture.md` — system design constraints
   - `docs/testing.md` — test conventions and patterns

## Phase 2: Plan

3. **Enter planning mode:**
   - Use EnterPlanMode to create implementation plan
   - Plan file at: `.claude/plans/{task-id}-{slug}.md`
   - Break task into specific steps
   - Identify files to read, modify, or create
   - Define test cases

## Phase 3: Execute

4. **Implement the plan:**
   - Follow steps sequentially
   - Write/modify code
   - Run tests using the project's test command (from CLAUDE.md or docs/testing.md)
   - If tests fail, fix issues before proceeding — do NOT mark task complete with failing tests

## Phase 4: Complete and Archive

5. **Mark task complete in TODO.md:**
   - Change `- [ ]` to `- [x]`
   - Add completion date and plan link

6. **Archive the completed task:**
   - Determine the appropriate feature file:
     - Sprint 0 tasks: category determines file (BUG/SEC/INFRA/PERF → `docs/features/production-readiness.md`, others → match by context or ask user)
     - Sprint tasks: match to feature area from task ID or context
   - If feature file exists, append to "Completed Work" section with: task ID, description, date, plan link
   - If feature file doesn't exist, create it using the standard template
   - Remove the completed task line from TODO.md

7. **Git commit:**
   - Stage changed files
   - Commit with short message (max 2 lines, no author mention)

## Phase 5: Report

8. **Sprint completion check:**
   - Count remaining `- [ ]` tasks in the current sprint section
   - If zero: "Sprint {N} is complete. Run /replan to start the next sprint."

9. **Inform user:**
   ```
   Task {Task-ID} complete: {Description}

   Changes:
   - {list of files modified}

   Archived to: docs/features/{area}.md
   Plan: .claude/plans/{task-id}-{slug}.md
   ```
