
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
