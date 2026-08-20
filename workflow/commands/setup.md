---
description: Bootstrap the gen-3 planning workflow in a greenfield repository (multi-level, multi-repo)
argument-hint: Optional level (1, 2, or 3)
---

# Setup Planning Workflow (greenfield)

Initialize the gen-3 sprint-based planning workflow in the current repository.
Keep it low ceremony — setup is run rarely; ask only what's needed and don't bloat.

## Greenfield Guard (check first)

`/setup` is for **greenfield** repos. If the repo already has a legacy planning
layout, do NOT convert it here — point the user to `/realign`:

- If `PLAN.md`, `wiki/`, or `docs/specs.md` exists (gen-1/gen-2 conventions), stop
  and say: "This repo has an existing planning layout. Run `/realign` to migrate it
  to gen-3 (dry-run plan first, then a branch). `/setup` is for greenfield repos."
- If `TODO.md` already exists, warn that gen-3 setup is already present and ask
  whether to continue (only fill in missing files) or abort.

## Detect Context

1. Check if `.repos.json` exists in a **parent** directory → we are inside a subrepo.
   - If yes, scope all file creation to the current directory, skip the multi-repo
     question, and use the directory name as `{REPO_NAME}`.
2. Otherwise, proceed with normal setup (central or single-repo).

## Determine Level

If `$ARGUMENTS` contains a level number (1, 2, or 3), use it. Otherwise AskUserQuestion:

**Question:** "What level of planning structure do you need?"
- **Level 1 — Planning core**: `TODO.md`, `CLAUDE.md`, `DECISIONS.md`, `CRITICAL.md`,
  and gitignored `.claude/plans/`. Best for small tools, scripts, side projects.
- **Level 2 — + spec/design/docs**: Level 1 plus the full Option-A doc layout
  (`spec/`, `design/`, `docs/`). Best for active projects with multiple features.
- **Level 3 — + seeded feature areas**: Level 2 plus seeded `docs/features/*.md`,
  `spec/standards.md`, and roadmap sections per area. Best for established products.

## Gather Information

All levels:
1. **Project name** — AskUserQuestion: "Project name and one-line description?"
2. **Test command** — AskUserQuestion: "What is the test/build/lint command?"
   (e.g. `just test`, `npm test && npm run lint`, `pytest && ruff check`, or "none")

Level 2+:
3. **Stack/tech** — AskUserQuestion: "What is the tech stack?"

Level 3 only:
4. **Feature areas** — AskUserQuestion: "Initial feature areas? (comma-separated
   lowercase slugs, e.g. auth, api, frontend)"

## Multi-Repo Question (only if not inside a subrepo)

5. **Multi-repo** — AskUserQuestion: "Is this a multi-repo project?"
   - **Yes**: central repo with subrepos as subdirectories
   - **No**: single-repo project

If **Yes**:
6. **Subrepo directories** — AskUserQuestion: "List the subrepo subdirectories
   (comma-separated, e.g. api, frontend, shared)"
7. Create `.repos.json` from `${CLAUDE_PLUGIN_ROOT}/references/repos-config-template.json` with an
   entry `{ "name": "{dir}", "path": "{dir}" }` per subrepo.
8. For each subrepo directory, append `{dir}/` to `.gitignore` (create if needed).
9. The central `TODO.md` gets `**Scope:** Central (cross-cutting)` after the header.

## Create Files

Read templates from the plugin's `references/` directory at `${CLAUDE_PLUGIN_ROOT}/references/`.
For gen-3 files that have no template yet, create them with the sensible default
content described inline below. **Target directory:** current directory (central or
single-repo) or the subrepo directory (if inside a subrepo).

### Level 1 — planning core (all levels include this)

1. **TODO.md** — from `${CLAUDE_PLUGIN_ROOT}/references/todo-template.md`. Replace `{PROJECT_NAME}`,
   `{DATE}`. Normalize the counter comment to lowercase:
   `<!-- Counters: sec=0 bug=0 infra=0 perf=0 debt=0 rel=0 -->`. Ensure the footer
   references gen-3 command names (`/open | /implement | /new-task | /new-feature |
   /replan | /status`).
   - Multi-repo central: add `**Scope:** Central (cross-cutting)` after line 1.
   - Inside a subrepo: add `**Repo:** {REPO_NAME}` after line 1.
2. **CLAUDE.md** — append `${CLAUDE_PLUGIN_ROOT}/references/claude-md-section.md` (create the file if
   absent). Replace `{TEST_COMMAND}`. Multi-repo central: also append the multi-repo
   section. (This section documents the gen-3 layout, checkbox states `- [ ] / - [x]
   / - [!]`, the `S<sprint>-<feature>-<seq>` lowercase ID format, and the
   verification ladder T1/T2/T3.)
3. **DECISIONS.md** — from `${CLAUDE_PLUGIN_ROOT}/references/decisions-template.md`.
   Append-only; agents read this before working and append a dated entry (decision,
   rationale, gotchas) after each task.
4. **CRITICAL.md** — from `${CLAUDE_PLUGIN_ROOT}/references/critical-template.md`.
   Lists sensitive paths (auth, payments, migrations, `spec/`). Any task touching a
   listed path auto-escalates (stronger model + mandatory review before commit).
   Seeded with `spec/` already listed.
5. **.gitignore** — ensure `.claude/` is ignored (append if missing). Create the
   `.claude/plans/` directory (local-only; plan files named `{task-id}-{slug}.md`).

### Level 2 — add the Option-A doc layout (includes Level 1)

Create these under the target directory:

**spec/ — THE WHAT (requirements; STATUS-FREE; protected):**
6. **spec/cujs.md** — from `${CLAUDE_PLUGIN_ROOT}/references/spec-cujs-template.md`.
   Replace `{PROJECT_NAME}`. (Includes the `Driver:` / `Judge:` fields the T3 ladder uses.)
7. **spec/standards.md** — from `${CLAUDE_PLUGIN_ROOT}/references/spec-standards-template.md`.
   Replace `{PROJECT_NAME}`, `{STACK}`, `{TEST_COMMAND}`.
8. **spec/contracts.md** — from `${CLAUDE_PLUGIN_ROOT}/references/spec-contracts-template.md`.
   Replace `{PROJECT_NAME}`.
9. **spec/open-questions.md** — from `${CLAUDE_PLUGIN_ROOT}/references/spec-open-questions-template.md`.

**design/ — THE HOW (built):**
10. **design/architecture.md** — from `${CLAUDE_PLUGIN_ROOT}/references/design-architecture-template.md`.
    Replace `{PROJECT_NAME}`, `{STACK}`.
11. **design/seams.md** — from `${CLAUDE_PLUGIN_ROOT}/references/design-seams-template.md`.
12. **design/patterns.md** — from `${CLAUDE_PLUGIN_ROOT}/references/design-patterns-template.md`.
13. **design/decisions/** — create the directory; add a `README.md` explaining it holds
    immutable ADRs (`ADR-NNN-slug.md`, format in
    `${CLAUDE_PLUGIN_ROOT}/references/design-adr-template.md`), paired with the
    append-only `DECISIONS.md`.

**docs/ — planning/ops:**
14. **docs/roadmap.md** — from `${CLAUDE_PLUGIN_ROOT}/references/roadmap-template.md`. Replace
    `{PROJECT_NAME}`, `{DATE}`.
15. **docs/testing.md** — from `${CLAUDE_PLUGIN_ROOT}/references/testing-template.md`. Replace
    `{PROJECT_NAME}`, `{TEST_COMMAND}`.
16. **docs/runbooks/** — create the directory with a `README.md` stub (operational
    runbooks live here; format in `${CLAUDE_PLUGIN_ROOT}/references/runbook-template.md`).
17. **docs/features/production-readiness.md** — from
    `${CLAUDE_PLUGIN_ROOT}/references/feature-template.md`. `{FEATURE_NAME}` = "Production Readiness",
    `{DESCRIPTION}` = "Sprint 0 archive: critical bugs, security fixes, infra."

### Level 3 — seed feature areas (includes Level 2)

18. For each feature area (lowercase slug) provided:
    - **docs/features/{area}.md** — from `${CLAUDE_PLUGIN_ROOT}/references/feature-template.md`.
      `{FEATURE_NAME}` = the area name, `{DESCRIPTION}` = "Feature area for {area}."
    - Add an `{area}` section to `docs/roadmap.md`.
    - Add an `{area}` section to `spec/standards.md`.
    - Add `{area}` to the TODO.md counter comment.

## Multi-Repo: Initialize Subrepos

If multi-repo was selected, for each subrepo directory:
19. If the directory does not exist, inform the user and skip.
    - Run the same file-creation steps (at the chosen level) inside `{subrepo-dir}/`.
    - Replace `{PROJECT_NAME}` with `{project-name}/{repo-name}`.
    - Add `**Repo:** {repo-name}` after the TODO.md header line.
    - Each subrepo gets its own CLAUDE.md workflow section (without the multi-repo
      section) and its own `DECISIONS.md` / `CRITICAL.md`.

## Report

```
Gen-3 workflow initialized for {project} (Level {N}):
  - TODO.md, CLAUDE.md, DECISIONS.md, CRITICAL.md
  - .gitignore (.claude/ ignored), .claude/plans/ (local)
  [Level 2+]
  - spec/ (cujs.md, standards.md, contracts.md, open-questions.md)
  - design/ (architecture.md, seams.md, patterns.md, decisions/)
  - docs/ (roadmap.md, testing.md, runbooks/, features/production-readiness.md)
  [Level 3]
  - docs/features/{area}.md (one per feature area)
  [Multi-Repo]
  - .repos.json ({N} subrepos registered), .gitignore (subrepo dirs added)
  - {repo}/ per-subrepo layout

Next steps:
  /repos — manage the subrepo registry
  /new-feature — add features (requirements → spec/, decisions → design/)
  /new-task — add critical issues to Sprint 0
  /open — see current priorities

Existing (non-greenfield) repo? Use /realign instead of /setup.
```
