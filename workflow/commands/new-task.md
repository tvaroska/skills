---
description: Add a critical issue to Sprint 0 in TODO.md
argument-hint: Optional task description
---

# New Sprint 0 Task

Sprint 0 is the always-active triage lane for production readiness, security, and
critical issues. This command only adds a task — it never edits `spec/`, `design/`,
or touches code.

Initial description: $ARGUMENTS

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: ask which repo to target (see below)
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: target the current repo's TODO.md
   - If neither → **single-repo mode**: target the current directory's TODO.md

2. **Repo selection (central only):**
   - Read `.repos.json` to get the repo list
   - AskUserQuestion: "Which repo should this task be added to?" with options: "central" + each registered repo name
   - Resolve the target TODO.md path: `.` for central, `{repo.path}/` for a subrepo

## Gather Information

Use AskUserQuestion to collect:

1. **Task Description** — "Describe the issue" (pre-fill with $ARGUMENTS if provided)

2. **Category** — "What category?" Each maps to a lowercase feature slug used in the task ID:
   - Security → `sec`
   - Production Bug → `bug`
   - Infrastructure → `infra`
   - Performance → `perf`
   - Technical Debt → `debt`
   - Release → `rel`

3. **Severity** — "How critical is this issue?"
   - P0 - Critical: System down, security breach, data loss. Fix immediately.
   - P1 - High: Major user impact, blocks key workflows. Fix within 1-2 days.
   - P2 - Medium: Moderate impact, workaround exists. Fix this sprint.

4. **Effort** — "Estimated effort?"
   - Small (< 2 hours)
   - Medium (2-8 hours)
   - Large (1-2 days)

## Generate Task ID

Task IDs use the gen-3 format `S<sprint>-<feature>-<seq>` with a **lowercase**
feature slug. For Sprint 0 the feature slug is the chosen category (`sec`, `bug`, …).

1. Read the target TODO.md and find the Sprint 0 section.
2. Look for the counter comment: `<!-- Counters: sec=N bug=N infra=N perf=N debt=N rel=N -->`
   - If found, read the counter for the chosen category and increment it.
   - If not found, scan for the highest existing `S0-{feature}-N` and add 1 (create the counter comment below).
3. Task ID: `S0-{feature}-{N}` (e.g. `S0-sec-1`, `S0-infra-3`).

## Add to TODO.md

1. Insert the task in the Sprint 0 section of the target TODO.md, maintaining
   priority order (P0 first, then P1, then P2). Use an open checkbox:
   ```
   - [ ] **S0-{feature}-{N}**: {Description} ({Severity}, {Effort})
         Added: {today's date}
   ```
   (Checkbox states used across the workflow: `- [ ]` open · `- [x]` done ·
   `- [!]` attempted-but-failed. New tasks always start `- [ ]`.)

2. Update (or create) the counter comment, keeping it lowercase:
   ```
   <!-- Counters: sec={n} bug={n} infra={n} perf={n} debt={n} rel={n} -->
   ```

## Report

```
Task added to Sprint 0: S0-{feature}-{N}
Location: {repo-name}/TODO.md > Sprint 0
Severity: {Severity}
Effort: {Effort}
```

If the task's description references a path listed in `CRITICAL.md`, add:
"This touches a CRITICAL area — /implement will auto-escalate (stronger model +
mandatory review before commit)."

If P0, add: "This is a critical issue. Consider running /implement S0-{feature}-{N} immediately."
