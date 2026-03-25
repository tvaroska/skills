---
description: Bootstrap the planning workflow in any repository (multi-level, multi-repo support)
argument-hint: Optional level (1, 2, or 3)
---

# Setup Planning Workflow

Initialize the sprint-based planning workflow in the current repository.

## Detect Context

1. Check if `.repos.json` exists in a parent directory → we are inside a subrepo
   - If yes, scope all file creation to the current directory and skip the multi-repo question
   - Use the directory name as `{REPO_NAME}`
2. Otherwise, proceed with normal setup (central or single-repo)

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

## Multi-Repo Question (only if not inside a subrepo)

5. **Multi-repo** — AskUserQuestion: "Is this a multi-repo project?"
   - **Yes**: This is a central repo with subrepos as subdirectories
   - **No**: Single-repo project (current behavior)

If **Yes**:
6. **Subrepo directories** — AskUserQuestion: "List the subrepo subdirectories (comma-separated, e.g., api, frontend, shared)"
7. Create `.repos.json` from `../references/repos-config-template.json` with an entry for each subrepo
8. For each subrepo directory, append `{dir}/` to `.gitignore` (create `.gitignore` if needed)
9. The central TODO.md gets `**Scope:** Central (cross-cutting)` after the header line

## Create Files

Read templates from the plugin's `references/` directory (relative to this command file, at `../../references/`).

**Target directory:** Current directory (for central or single-repo) or subrepo directory (if inside a subrepo).

### Level 1 (2 files)

1. **TODO.md** — Read `../../references/todo-template.md`. Replace `{PROJECT_NAME}` with project name, `{DATE}` with today's date.
   - If multi-repo central: add `**Scope:** Central (cross-cutting)` after the first line
   - If inside a subrepo: add `**Repo:** {REPO_NAME}` after the first line
2. **CLAUDE.md** — If exists, append the content from `../../references/claude-md-section.md`. If not, create it with that content. Replace `{TEST_COMMAND}` with the test command.
   - If multi-repo central: also append the multi-repo section from the template

### Level 2 (7 files, includes Level 1)

3. **docs/roadmap.md** — Read `../../references/roadmap-template.md`. Replace `{PROJECT_NAME}`, `{DATE}`.
4. **docs/cujs.md** — Read `../../references/cujs-template.md`. Replace `{PROJECT_NAME}`.
5. **docs/specs.md** — Read `../../references/specs-template.md`. Replace `{PROJECT_NAME}`.
6. **docs/architecture.md** — Read `../../references/architecture-template.md`. Replace `{PROJECT_NAME}`, `{STACK}`.
7. **docs/testing.md** — Read `../../references/testing-template.md`. Replace `{PROJECT_NAME}`, `{TEST_COMMAND}`.
8. **docs/features/production-readiness.md** — Read `../../references/feature-template.md`. Replace `{FEATURE_NAME}` with "Production Readiness", `{DESCRIPTION}` with "Sprint 0 archive: critical bugs, security fixes, infrastructure improvements."

### Level 3 (7+ files, includes Level 2)

9. For each feature area provided by the user:
   - **docs/features/{area-slug}.md** — Read `../../references/feature-template.md`. Replace `{FEATURE_NAME}` with the area name, `{DESCRIPTION}` with "Feature area for {area name}."
   - Add the area as a section in `docs/roadmap.md`
   - Add the area as a section in `docs/specs.md`

## Multi-Repo: Initialize Subrepos

If multi-repo was selected:

10. For each subrepo directory listed:
    - If the directory does not exist, inform user and skip
    - Run the same file creation steps (at the chosen level) inside `{subrepo-dir}/`
    - Replace `{PROJECT_NAME}` with `{project-name}/{repo-name}`
    - Add `**Repo:** {repo-name}` after the TODO.md header line
    - Each subrepo gets its own CLAUDE.md with the workflow section (without the multi-repo section)

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
  [Multi-Repo]
  - .repos.json ({N} subrepos registered)
  - .gitignore (subrepo dirs added)
  - {repo}/TODO.md (per subrepo)
  - {repo}/CLAUDE.md (per subrepo)
  - {repo}/docs/ (per subrepo, if Level 2+)

Next steps:
  /repos — manage subrepo registry
  /new-feature — add features to backlog
  /new-task — add critical issues to Sprint 0
  /open — see current priorities
```
