# Workflow Review: Custom Planning Commands

**Date:** 2026-03-20
**Scope:** `/replan`, `/open`, `/implement`, `/new-task`, `/new-feature`
**Context:** Each command operates within a single project repository

---

## 1. How It Currently Works

### Architecture

The workflow is a **prompt-driven planning system** built on Claude Code skills. Five slash commands operate on a shared set of Markdown files within one project repository at a time.

```
User (in project directory)
  |
  v
Slash Commands (/open, /implement, /new-task, /new-feature, /replan)
  |
  v
Skill Prompts (system-level, expanded at invocation)
  |
  v
Claude reads/writes planning files in current project
  |
  v
Per-Project File Structure:
  TODO.md                     -- Active sprint + Sprint 0
  docs/roadmap.md             -- Strategic feature overview
  docs/cujs.md                -- Critical User Journeys
  docs/specs.md               -- Product specs & requirements
  docs/architecture.md        -- System design & tech decisions
  docs/testing.md             -- Test strategy & conventions
  docs/features/*.md          -- Complete feature history
  WORKFLOW.md                 -- Process documentation (reference)
```

### File Structure Per Project

| File | Purpose | Size Target |
|------|---------|-------------|
| `TODO.md` | Sprint 0 (always active) + current sprint | ~150 lines |
| `docs/roadmap.md` | Strategic priorities by feature area | ~200 lines |
| `docs/cujs.md` | Critical User Journeys — end-to-end flows that matter most | ~100 lines |
| `docs/specs.md` | Product specs — requirements and acceptance criteria per feature | ~200 lines |
| `docs/architecture.md` | System design — components, tech choices, data flow | ~200 lines |
| `docs/testing.md` | Test strategy — how to run, coverage, patterns, how to add tests | ~100 lines |
| `docs/features/*.md` | Complete history per feature | Grows over time |
| `WORKFLOW.md` | Process documentation | Reference doc |

### Command Behaviors

#### `/open` - Show Top 3 Open Tasks
- Reads `TODO.md` in current project
- Extracts unchecked tasks (`- [ ]`)
- Prioritizes: Sprint 0 (P0 > P1 > P2) before current sprint
- Shows task ID, description, effort, files
- Suggests next actions (`/implement`, `/new-task`, `/replan`)

#### `/implement {task-id}` - Execute a Task
- Reads `TODO.md` to find task by ID
- Validates dependencies are complete
- Reads `docs/cujs.md` to understand the full user journey context
- Reads `docs/specs.md` for requirements and acceptance criteria
- Reads `docs/architecture.md` to understand system design
- Reads `docs/testing.md` for test conventions and patterns
- Enters planning mode, creates plan in `.claude/plans/`
- Executes implementation (code changes, tests)
- Marks task complete in `TODO.md` with date and plan link
- Suggests `/replan` if sprint complete

#### `/new-task` - Add Critical Issue to Sprint 0
- Uses `AskUserQuestion` for guided input (description, category, severity, effort)
- Generates task ID: `S0-{CATEGORY}-{N}` (SEC, BUG, INFRA, PERF, DEBT, DATA)
- Inserts into `TODO.md` Sprint 0 section in priority order
- P0 issues trigger immediate-action warning

#### `/new-feature` - Add Feature to Backlog
- Uses `AskUserQuestion` for guided input (name, area, problem, priority, scope)
- Writes product requirements to `docs/specs.md` under the relevant feature section
- Asks which CUJ this feature supports, updates `docs/cujs.md` if needed
- Creates/updates `docs/features/{area}.md` in "Planned Work" section
- Optionally updates `docs/roadmap.md` for P0/P1 features
- Asks whether to add to current sprint or keep in backlog

#### `/replan` - Archive and Update Plans
- Reads all planning files (TODO.md, roadmap.md, features/*.md)
- Moves completed Sprint 0 tasks to `docs/features/production-readiness.md`
- Moves completed sprint tasks to appropriate feature files
- Updates TODO.md: promotes preview sprint, adds new preview
- Updates roadmap.md statuses and percentages
- Asks user about next steps

### Task ID Format

```
S{sprint}-{CATEGORY}-{number}
  |          |          |
  |          |          +-- Sequential within category
  |          +-- DB, BE, FE, TEST, QA, SEC, INFRA, REL, PERF
  +-- 0 = critical/always-active, N = feature sprint
```

### Actual Usage (Evidence from TODO.md files)

| Project | Sprint 0 Tasks | Current Sprint | Completed Sprints | Feature Files |
|---------|---------------|----------------|-------------------|---------------|
| **content** | 45+ completed, 0 open | Sprint 23 (complete) | 22 sprints | 21 files |
| **downloader** | 19 completed | Sprint 4 (planned) | 4 sprints | 6 files |
| **bingo** | 22 completed | Sprint 4 (in progress) | 3 sprints | 3 files |
| **services** | 14 completed | Sprint 1 (planned) | 1 sprint | 3 files |

### Task Lifecycle

```
Feature idea --> /new-feature --> docs/specs.md (requirements)
                                       |
                                  docs/cujs.md (link to journey)
                                       |
                                  /replan (sprint planning)
                                       |
                                  TODO.md (active sprint)
                                       |
                                  /implement {task-id}
                                  reads: cujs.md, specs.md, architecture.md, testing.md
                                       |
                                  TODO.md [x] (complete)
                                       |
                                  /replan (archive)
                                       |
                                  docs/features/{area}.md (history)

Critical bug --> /new-task --> TODO.md Sprint 0
                                  |
                              /implement S0-XXX-N
                                  |
                              /replan (archive)
                                  |
                              docs/features/production-readiness.md
```

---

## 2. What Works Well

1. **Sprint 0 as always-active triage lane** - Production bugs and security issues never get lost in sprint backlogs. Clear escalation path with P0/P1/P2 severity. The pattern has proven durable -- content repo has used it for 45+ critical issues over 3+ months.

2. **Feature-based archiving** - Completed work lives in `docs/features/*.md` organized by capability, not by time. This creates useful living documentation that survives sprint transitions.

3. **Guided task creation** - `AskUserQuestion` with predefined options prevents incomplete task definitions. Categories and severities are consistent across all projects.

4. **Three-tier separation** - TODO.md (tactical/current), roadmap.md (strategic/future), features/*.md (historical/reference) each serve a distinct purpose with clear boundaries.

5. **Plan file linkage** - `/implement` creates `.claude/plans/` files that preserve implementation reasoning, linked from completed tasks. This provides an audit trail of design decisions.

6. **Portable across projects** - Same file structure and commands work in content, downloader, bingo, and services. CLAUDE.md in each project references the same workflow.

7. **Sprint 0 never closes** - Unlike feature sprints, Sprint 0 is perpetual. New critical issues always have a home without waiting for sprint planning.

---

## 3. Gaps and Problems

### G1: TODO.md Grows Unbounded

**Severity:** High

Content's `TODO.md` is 513 lines with 45+ completed Sprint 0 tasks still inline. The design says "~150 lines, current work only" but completed tasks accumulate because `/replan` isn't run frequently enough. Two fully complete sprints (22 and 23) are still in the file.

**Root cause:** There's no trigger to run `/replan`. It depends entirely on the user remembering to do it.

### G2: `/replan` Is Too Heavyweight and Ambiguous

**Severity:** Medium

`/replan` tries to do too much in one operation:
- Archive Sprint 0 completed tasks
- Archive current sprint completed tasks
- Determine which feature file each task belongs to
- Update roadmap.md statuses
- Promote preview sprint to current
- Create new preview sprint
- Ask user for priorities

This makes it slow, error-prone, and hard to run incrementally. The skill prompt doesn't specify how to determine which feature file a Sprint 0 task maps to (not all belong in `production-readiness.md` -- e.g., S0-FE-1 is a frontend task, S0-PERF-1 is performance).

### G3: `/new-feature` Feature Areas Are Hardcoded

**Severity:** Medium

The `/new-feature` skill lists feature areas specific to the content app (Vector Search, Content Relationships, PDF Processing, Writing Assistant, Integrations, UI/UX, Infrastructure). These options don't apply to downloader, bingo, or services. Running `/new-feature` in the bingo project would present irrelevant choices.

### G4: No Sprint Completion Detection

**Severity:** Medium

There is no mechanism to:
- Know when a sprint is "done" (all tasks checked)
- Alert when Sprint 0 tasks have been open too long
- Track whether the stated "2-week cadence" is being followed
- Auto-suggest `/replan` when appropriate

Content's Sprint 22 and 23 are fully complete but never archived. Downloader's Sprint 4 has been "planned" since 2026-01-21 (2 months ago) with no progress.

### G5: Task Numbering Conflicts

**Severity:** Low

Task IDs are auto-generated by scanning TODO.md for the highest number in a category. But when tasks are archived to feature files via `/replan`, the highest number disappears from TODO.md. A new `/new-task` could generate a duplicate ID.

**Evidence:** Content has S0-BUG-29, S0-PERF-12, S0-INFRA-13. If these are archived and new tasks are created, numbering restarts from the remaining highest.

### G6: No Validation That Tasks Are Actually Done

**Severity:** Low

`/implement` marks tasks complete in TODO.md but there's no verification that:
- Tests were run and passed
- Code was committed
- The implementation matches the task description

The CLAUDE.md rule says "Run tests before committing" but `/implement` doesn't enforce this.

### G7: WORKFLOW.md Only Exists in Content Repo

**Severity:** Low

The canonical process documentation (`content/WORKFLOW.md`) contains the authoritative skill definitions and complete workflow documentation. Other projects reference the workflow via CLAUDE.md but don't have this file. The prompts and examples in WORKFLOW.md are only visible when working in the content repo.

### G8: Stale Planning Files

**Severity:** Low

When `/replan` isn't run, all three tiers drift:
- TODO.md shows completed work as current
- roadmap.md status indicators lag behind reality
- Feature files miss completed work

Content's `roadmap.md` says "Last Updated: 2026-03-03" but Sprint 23 completed after that. The problem compounds over time.

### G9: Sprint 0 Category Proliferation

**Severity:** Low

Content repo has used 13 different Sprint 0 categories (SEC, BUG, INFRA, PERF, DEBT, FE, UX, A11Y, CLEAN, DOC, TEST, REL, DATA). The original design lists 6 (SEC, BUG, INFRA, PERF, DEBT, DATA). The expanding set makes scanning and prioritizing harder.

### G10: No Setup Command for New Projects

**Severity:** Medium

There is no `/setup` or `/init` command to bootstrap the workflow in a new repository. Currently, adopting this workflow requires:

1. Manually creating the directory structure (`docs/features/`)
2. Writing a TODO.md from scratch with the correct Sprint 0 template
3. Writing a docs/roadmap.md with the correct structure
4. Copying the planning workflow section into the project's CLAUDE.md
5. Optionally copying WORKFLOW.md for reference

The `content/WORKFLOW.md` has a "Quick Setup" section and a "Migration Path" section, but these are documentation -- not an executable command. A developer wanting to use this workflow on a new project (or an existing project without it) must read WORKFLOW.md, understand the file templates, and manually create everything.

This creates an adoption barrier: the workflow is well-proven in 4 repos but hard to replicate. The templates for TODO.md, roadmap.md, and feature files are documented inline in WORKFLOW.md but not extractable as a single action.

**What's needed:** A single command that scaffolds the full file structure, populates templates, and adds the workflow reference to CLAUDE.md -- making any repo workflow-ready in seconds.

---

## 4. Recommendations

### R1+R2: `/implement` Owns Cleanup, `/replan` Owns Transitions (G1, G2, G4)

**Effort:** Medium | **Impact:** High

Make `/implement` responsible for archiving each task it completes. After marking a task `[x]` in TODO.md:

1. **Archive immediately:** Move the completed task entry from TODO.md to the appropriate `docs/features/{area}.md` file (determine area from task category and context, or ask if ambiguous).
2. **Update counters:** If using task ID counters (R4), preserve them.
3. **Sprint completion check:** Count remaining open tasks in the current sprint. If zero remain, prompt: "Sprint {N} is complete. Run /replan to start the next sprint?"

This means TODO.md never accumulates completed tasks — each one is archived the moment it's done.

**`/replan` becomes sprint-transition only:**
- No archiving responsibility (already handled by `/implement`)
- Promote preview sprint to current
- Create new preview sprint
- Update `docs/roadmap.md` statuses and percentages
- Ask user about next sprint priorities

This eliminates the need for a separate `/archive` command. `/replan` becomes lighter, faster, and only runs at sprint boundaries. The main cause of TODO.md bloat (unarchived completed tasks) is eliminated at the source.

### R3: Make `/new-feature` Repo-Aware (G3)

**Effort:** Small | **Impact:** Medium

Replace hardcoded feature area options with dynamic detection:
1. List existing `docs/features/*.md` files in the current project
2. Present filenames as area options (e.g., "scheduling", "browser-rendering", "production-readiness")
3. Add "New area..." as a final option for creating a new feature file

This makes the command work correctly in any project.

### R4: Add Task ID Counter Comment (G5)

**Effort:** Small | **Impact:** Medium

Add a counter comment at the top of TODO.md's Sprint 0 section:
```markdown
<!-- Counters: BUG=29 SEC=10 INFRA=13 PERF=12 DEBT=1 FE=5 -->
```
Update `/new-task` to read and increment this counter. Update `/replan` to preserve it during archiving. Prevents ID collisions after tasks are archived.

### R5: Gate `/implement` Completion on Tests (G6)

**Effort:** Small | **Impact:** Medium

Add to the `/implement` skill prompt:
- Before marking `[x]`, run the project's test command (`just test` or equivalent from CLAUDE.md)
- If tests fail, keep task as in-progress and report failures
- Only mark complete after tests pass

This enforces the existing CLAUDE.md rule ("Run tests before committing") mechanically.

### R6: Move WORKFLOW.md to Root (G7)

**Effort:** Small | **Impact:** Low

Move `content/WORKFLOW.md` to `products/WORKFLOW.md` (or `products/docs/workflow.md`). It documents a cross-project process -- it shouldn't live inside one sub-repo. Update CLAUDE.md references in all projects.

### R7: Add Staleness Warnings to `/open` (G4, G8)

**Effort:** Small | **Impact:** Medium

Add warnings to `/open` output:
- "Sprint {N} has been active for {X} days (cadence: 14 days)" when > 2 weeks
- "{N} completed tasks in TODO.md need archiving -- run /replan" when > 5
- "S0-{ID} (P0) has been open for {X} days" for old high-severity tasks

### R8: Consolidate Sprint 0 Categories (G9)

**Effort:** Small | **Impact:** Low

Reduce to 6 canonical categories: SEC, BUG, INFRA, PERF, DEBT, REL. Map the rest:
- FE, UX, A11Y --> BUG (if broken behavior) or DEBT (if improvement)
- DOC, CLEAN --> DEBT
- TEST --> DEBT

Update `/new-task` options accordingly.

### R9: Add `/setup` Command for New Projects (G10)

**Effort:** Medium | **Impact:** High

Create a `/setup` skill that bootstraps the workflow in any repository. The skill uses `AskUserQuestion` to determine the appropriate level, then scaffolds progressively. Template content lives in `references/` files within the skill directory, providing gold-standard examples.

#### Setup Levels

**Level 1 — Planning Only** (minimal, 2 files)
- `TODO.md` with Sprint 0 template
- CLAUDE.md workflow section appended
- Best for: small tools, scripts, side projects
- Questions: project name, test command

**Level 2 — Planning + Docs** (standard, 7 files)
- Everything in Level 1
- `docs/roadmap.md` — strategic priorities
- `docs/cujs.md` — critical user journeys
- `docs/specs.md` — product specs & requirements
- `docs/architecture.md` — system design
- `docs/testing.md` — test strategy
- `docs/features/production-readiness.md` — Sprint 0 archive target
- Best for: active projects with multiple features
- Questions: project name, test command, stack/tech

**Level 3 — Full Setup** (complete, 7+ files)
- Everything in Level 2
- `docs/features/{area}.md` — one per initial feature area, seeded from user input
- `docs/roadmap.md` pre-populated with feature areas
- `docs/specs.md` pre-populated with sections per feature area
- Best for: established products, team projects
- Questions: project name, test command, stack/tech, feature areas

#### AskUserQuestion Flow

1. "What level of planning do you need?" → Level 1 / Level 2 / Level 3
2. Project name + one-line description (all levels)
3. Test command, e.g. `just test`, `npm test`, `pytest` (all levels)
4. Stack/tech, e.g. "FastAPI + React", "Go CLI" (Level 2+)
5. Initial feature areas, e.g. "auth, api, frontend" (Level 3 only)

Level 1 completes in two questions and under 30 seconds. Level 3 is the full experience.

#### Skill Structure

```
setup/
  SKILL.md                          # Skill prompt with level logic
  references/
    plan-template.md                # Gold-standard TODO.md template
    roadmap-template.md             # Roadmap template
    cujs-template.md                # CUJs template
    specs-template.md               # Specs template
    architecture-template.md        # Architecture template
    testing-template.md             # Testing template
    feature-template.md             # Per-feature file template
    claude-md-section.md            # Workflow section to append to CLAUDE.md
```

#### Output

After scaffolding, report what was created and suggest next steps:
```
Workflow initialized for {project} (Level {N}):
  - TODO.md (Sprint 0 + Sprint 1 template)
  - docs/roadmap.md (Level 2+)
  - docs/features/ (Level 3: {N} feature files)
  - CLAUDE.md updated with workflow section

Next steps:
  - /new-feature to add features to backlog
  - /new-task to add critical issues to Sprint 0
  - /open to see current priorities
```

**Why this matters:** The workflow has proven effective across 4 projects and 90+ sprints. But every new project currently requires 30+ minutes of manual scaffolding. A multi-level `/setup` command lets users choose the right amount of structure — from a lightweight TODO.md to a full documentation suite — making adoption trivial for any repo.

---

## 5. Priority Matrix

| # | Recommendation | Effort | Impact | Do When |
|---|---------------|--------|--------|---------|
| R9 | /setup command (multi-level) for new projects | Medium | High | Now |
| R1+R2 | /implement archives on completion, /replan transitions only | Medium | High | Now |
| R4 | Task ID counter | Small | Medium | Now (quick win) |
| R5 | Test gate on /implement | Small | Medium | Now (quick win) |
| R3 | Repo-aware /new-feature | Small | Medium | Next |
| R7 | Staleness warnings in /open | Small | Medium | Next |
| R6 | Move WORKFLOW.md | Small | Low | Whenever |
| R8 | Consolidate categories | Small | Low | Optional |

---

## 6. Summary

The workflow is well-designed for managing a single project's development lifecycle. The six-doc file structure (TODO.md / roadmap.md / cujs.md / specs.md / architecture.md / testing.md / features/*.md) and the Sprint 0 triage lane are particularly effective -- content repo has successfully processed 45+ critical issues and 23 sprints through this system.

The two main problems are **adoption friction** and **maintenance friction**:

1. **No setup command** -- the workflow is proven across 4 repos but requires manual scaffolding to adopt in a new project. A multi-level `/setup` lets users choose the right amount of structure (R9)
2. **Archiving doesn't happen** -- `/replan` is too heavyweight and doesn't get run, causing TODO.md to bloat. Fix: make `/implement` archive each task on completion, leaving `/replan` for sprint transitions only (R1+R2)

The highest-impact fixes are:

1. **Add multi-level `/setup` command** — Level 1 (planning only), Level 2 (+ docs), Level 3 (+ feature areas) — to bootstrap the workflow in any new repo (R9)
2. **Make `/implement` archive on completion** — each task is moved to feature files immediately, keeping TODO.md clean (R1+R2)
3. **Simplify `/replan` to sprint transitions only** — no archiving responsibility, faster and more focused (R1+R2)

All are achievable with skill prompt changes only -- no tooling or infrastructure required.
