---
description: Bootstrap the planning workflow in any repository (multi-level)
argument-hint: Optional level (1, 2, or 3)
---

# Setup Planning Workflow

Initialize the sprint-based planning workflow in the current repository.

## Determine Level

If `$ARGUMENTS` contains a level number (1, 2, or 3), use that. Otherwise, use AskUserQuestion:

**Question:** "What level of planning structure do you need?"
- **Level 1 - Planning Only**: Just TODO.md with Sprint 0 + CLAUDE.md workflow section. Best for small tools, scripts, side projects.
- **Level 2 - Planning + Docs**: TODO.md + docs/ (roadmap, CUJs, specs, architecture, testing). Best for active projects with multiple features.
- **Level 3 - Full Setup**: Everything in Level 2 + seeded feature area files. Best for established products, team projects.

## Gather Information

All levels:
1. **Project name** — AskUserQuestion: "What is the project name and a one-line description?"
2. **Test command** — AskUserQuestion: "What is the test command?" (e.g., `just test`, `npm test`, `pytest`, or "none")

Level 2+:
3. **Stack/tech** — AskUserQuestion: "What is the tech stack?" (e.g., "FastAPI + React", "Go CLI", "Python")

Level 3 only:
4. **Feature areas** — AskUserQuestion: "What are the initial feature areas? (comma-separated, e.g., auth, api, frontend)"

## Create Files

Read templates from the plugin's `references/` directory (relative to this command file, at `../references/`).

### Level 1 (2 files)

1. **TODO.md** — Read `../references/todo-template.md`. Replace `{PROJECT_NAME}` with project name, `{DATE}` with today's date.
2. **CLAUDE.md** — If exists, append the content from `../references/claude-md-section.md`. If not, create it with that content. Replace `{TEST_COMMAND}` with the test command.

### Level 2 (7 files, includes Level 1)

3. **docs/roadmap.md** — Read `../references/roadmap-template.md`. Replace `{PROJECT_NAME}`, `{DATE}`.
4. **docs/cujs.md** — Read `../references/cujs-template.md`. Replace `{PROJECT_NAME}`.
5. **docs/specs.md** — Read `../references/specs-template.md`. Replace `{PROJECT_NAME}`.
6. **docs/architecture.md** — Read `../references/architecture-template.md`. Replace `{PROJECT_NAME}`, `{STACK}`.
7. **docs/testing.md** — Read `../references/testing-template.md`. Replace `{PROJECT_NAME}`, `{TEST_COMMAND}`.
8. **docs/features/production-readiness.md** — Read `../references/feature-template.md`. Replace `{FEATURE_NAME}` with "Production Readiness", `{DESCRIPTION}` with "Sprint 0 archive: critical bugs, security fixes, infrastructure improvements."

### Level 3 (7+ files, includes Level 2)

9. For each feature area provided by the user:
   - **docs/features/{area-slug}.md** — Read `../references/feature-template.md`. Replace `{FEATURE_NAME}` with the area name, `{DESCRIPTION}` with "Feature area for {area name}."
   - Add the area as a section in `docs/roadmap.md`
   - Add the area as a section in `docs/specs.md`

## Report

After creating files, output:

```
Workflow initialized for {project} (Level {N}):
  - TODO.md (Sprint 0 + Sprint 1 template)
  - CLAUDE.md (workflow section added)
  [Level 2+]
  - docs/roadmap.md
  - docs/cujs.md
  - docs/specs.md
  - docs/architecture.md
  - docs/testing.md
  - docs/features/production-readiness.md
  [Level 3]
  - docs/features/{area}.md (one per feature area)

Next steps:
  /new-feature — add features to backlog
  /new-task — add critical issues to Sprint 0
  /open — see current priorities
```
