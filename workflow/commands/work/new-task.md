---
description: Add a critical issue to Sprint 0 in TODO.md
argument-hint: Optional task description
---

# New Sprint 0 Task

Sprint 0 is the always-active triage lane for production readiness, security, and critical issues.

Initial description: $ARGUMENTS

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: ask which repo to target (see below)
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: target current repo's TODO.md
   - If neither → **single-repo mode**: target current directory's TODO.md

2. **Repo selection (central only):**
   - Read `.repos.json` to get repo list
   - AskUserQuestion: "Which repo should this task be added to?" with options: "central" + each registered repo name
   - Resolve target TODO.md path: `.` for central, `{repo.path}/` for subrepo

## Gather Information

Use AskUserQuestion to collect:

1. **Task Description** — "Describe the issue" (pre-fill with $ARGUMENTS if provided)

2. **Category** — "What category?"
   - Security → SEC
   - Production Bug → BUG
   - Infrastructure → INFRA
   - Performance → PERF
   - Technical Debt → DEBT
   - Release → REL

3. **Severity** — "How critical is this issue?"
   - P0 - Critical: System down, security breach, data loss. Fix immediately.
   - P1 - High: Major user impact, blocks key workflows. Fix within 1-2 days.
   - P2 - Medium: Moderate impact, workaround exists. Fix this sprint.

4. **Effort** — "Estimated effort?"
   - Small (< 2 hours)
   - Medium (2-8 hours)
   - Large (1-2 days)

## Generate Task ID

1. Read the target TODO.md and find the Sprint 0 section
2. Look for counter comment: `<!-- Counters: BUG=N SEC=N ... -->`
   - If found, read the counter for the chosen category and increment
   - If not found, scan for highest `S0-{CATEGORY}-N` number and add 1
3. Task ID: `S0-{CATEGORY}-{N}`

## Add to TODO.md

1. Insert task in Sprint 0 section of the target TODO.md, maintaining priority order (P0 first, then P1, then P2):
   ```
   - [ ] **S0-{CATEGORY}-{N}**: {Description} ({Severity}, {Effort})
         Added: {today's date}
   ```

2. Update counter comment if present:
   ```
   <!-- Counters: BUG={updated} SEC={updated} ... -->
   ```

## Report

```
Task added to Sprint 0: S0-{CATEGORY}-{N}
Location: {repo-name}/TODO.md > Sprint 0
Severity: {Severity}
Effort: {Effort}
```

If P0, add: "This is a critical issue. Consider running /implement S0-{CATEGORY}-{N} immediately."
