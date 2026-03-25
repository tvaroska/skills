---
description: Implement a task from TODO.md, then archive it on completion
argument-hint: Task ID (e.g., S1-BE-3) — optionally prefixed with [repo] in multi-repo
---

# Implement Task

Implement task `$ARGUMENTS` from TODO.md, then archive the completed task.

## Phase 0: Resolve Repo

1. **Parse `$ARGUMENTS`** for optional repo prefix: `[repo-name] S1-BE-3` or just `S1-BE-3`

2. **Detect context:**
   - Check for `.repos.json` in the current directory → **central repo**
   - Check if a parent directory has `.repos.json` → **inside subrepo**
   - Neither → **single-repo mode**

3. **Resolve target repo and TODO.md path:**
   - **Single-repo / subrepo**: use current directory's TODO.md
   - **Central with repo prefix**: use `{repo.path}/TODO.md`
   - **Central without prefix**: search all TODO.md files (central + subrepos) for the task ID
     - If found in exactly one → use that repo
     - If found in multiple → ask user which repo
     - If not found → inform user and run `/open`

4. Set `{target-dir}` to the resolved repo directory for all subsequent file operations.

## Phase 1: Load Context

1. **Read `{target-dir}/TODO.md`** to find the task:
   - Description, files to modify, dependencies, acceptance criteria
   - If task not found, inform user and run `/open`
   - If task has dependencies, check they are complete (`- [x]`). If blocked, inform user.

2. **Read project context** from `{target-dir}/` (if files exist):
   - `docs/cujs.md` — understand the user journey this task supports
   - `docs/specs.md` — requirements and acceptance criteria
   - `docs/architecture.md` — system design constraints
   - `docs/testing.md` — test conventions and patterns

## Phase 2: Plan

3. **Enter planning mode:**
   - Use EnterPlanMode to create implementation plan
   - Plan file at: `.claude/plans/{task-id}-{slug}.md` (always in central/CWD's .claude/)
   - Break task into specific steps
   - Identify files to read, modify, or create (within `{target-dir}/`)
   - Define test cases

## Phase 3: Execute

4. **Implement the plan:**
   - Follow steps sequentially
   - Write/modify code within `{target-dir}/`
   - Run tests using the project's test command (from `{target-dir}/CLAUDE.md` or `{target-dir}/docs/testing.md`)
   - If tests fail, fix issues before proceeding — do NOT mark task complete with failing tests

## Phase 4: Complete and Archive

5. **Mark task complete in `{target-dir}/TODO.md`:**
   - Change `- [ ]` to `- [x]`
   - Add completion date and plan link

6. **Archive the completed task:**
   - Determine the appropriate feature file:
     - Sprint 0 tasks: category determines file (BUG/SEC/INFRA/PERF → `{target-dir}/docs/features/production-readiness.md`, others → match by context or ask user)
     - Sprint tasks: match to feature area from task ID or context
   - If feature file exists, append to "Completed Work" section with: task ID, description, date, plan link
   - If feature file doesn't exist, create it using the standard template
   - Remove the completed task line from `{target-dir}/TODO.md`

7. **Git commit:**
   - Stage changed files
   - Commit with short message (max 2 lines, no author mention)
   - If in a subrepo directory with its own `.git`, commit there

## Phase 5: Report

8. **Sprint completion check:**
   - Count remaining `- [ ]` tasks in the current sprint section of `{target-dir}/TODO.md`
   - If zero: "Sprint {N} is complete. Run /replan to start the next sprint."

9. **Inform user:**
   ```
   Task {Task-ID} complete: {Description}
   {Repo: {repo-name} — if multi-repo}

   Changes:
   - {list of files modified}

   Archived to: {target-dir}/docs/features/{area}.md
   Plan: .claude/plans/{task-id}-{slug}.md
   ```
