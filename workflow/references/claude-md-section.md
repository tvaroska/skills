
## Planning Workflow

This project uses a sprint-based planning workflow managed through slash commands.

### File Structure

| File | Purpose |
|------|---------|
| `TODO.md` | Sprint 0 (always active) + current sprint |
| `docs/roadmap.md` | Strategic priorities by feature area |
| `docs/cujs.md` | Critical User Journeys |
| `docs/specs.md` | Product specs and requirements |
| `docs/architecture.md` | System design and tech decisions |
| `docs/testing.md` | Test strategy and conventions |
| `docs/features/*.md` | Completed work history per feature area |

### Commands

- `/open` — Show top 3 open tasks
- `/implement {task-id}` — Implement and archive a task
- `/new-task` — Add critical issue to Sprint 0
- `/new-feature` — Define and add a new feature
- `/replan` — Sprint transition (close current, start next)
- `/status` — Project planning summary

### Task ID Format

`S{sprint}-{CATEGORY}-{number}` — e.g., S0-BUG-3, S1-BE-2

Sprint 0 categories: SEC, BUG, INFRA, PERF, DEBT, REL
Sprint N categories: project-specific (e.g., BE, FE, DB, TEST)

### Sprint 0 Priority

P0 (critical) > P1 (high) > P2 (medium). P0 issues should be addressed immediately.

### Test Command

Run `{TEST_COMMAND}` before committing. Tests must pass before marking tasks complete.

### Multi-Repo (if applicable)

This is a multi-repo workspace. The central repo aggregates planning across subrepos.

| File | Purpose |
|------|---------|
| `.repos.json` | Registry of subrepo subdirectories |
| `{repo}/TODO.md` | Repo-specific sprint tasks |
| `{repo}/docs/` | Repo-specific documentation |

**Context detection:** Commands auto-detect whether you're in the central repo (has `.repos.json`) or inside a subrepo.

- **From central:** `/open` and `/status` show aggregated views across all repos. `/new-task` and `/new-feature` ask which repo to target.
- **From subrepo:** Commands scope to that repo only.
- **Task display:** Aggregated views prefix repo name: `[api] S0-BUG-1`

**Commands:**
- `/repos` — list registered subrepos with task counts
- `/repos add <dir>` — register a subdirectory as a subrepo
- `/repos remove <dir>` — unregister a subrepo
- `/repos setup <dir>` — initialize workflow files in a subrepo
