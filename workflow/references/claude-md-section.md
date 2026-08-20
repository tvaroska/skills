
## Planning Workflow (gen-3)

This project uses a sprint-based planning workflow managed through slash commands.
Live status lives in ONE place (`TODO.md`); `spec/` and `design/` stay status-free.

### Layout (Option A)

| Path | Purpose |
|------|---------|
| `TODO.md` | Tasks + live status/counts (the ONLY place status lives) |
| `DECISIONS.md` | Append-only decision/learning log (committed) |
| `CRITICAL.md` | Registry of protected/sensitive paths (auto-escalate) |
| `spec/` | THE WHAT — requirements. Forkable, status-free, **protected**. `cujs.md`, `standards.md`, `contracts.md`, `demos/*.md`, `open-questions.md` |
| `design/` | THE HOW (as built) — `architecture.md`, `seams.md`, `patterns.md`, `decisions/*.md` (ADRs) |
| `docs/` | Planning/ops — `roadmap.md`, `testing.md`, `runbooks/*.md`, `features/*.md` (completed-work archive) |
| `.claude/plans/` | Per-task plans — LOCAL, gitignored, named `{task-id}-{slug}.md` |

Committed: `TODO.md`, `spec/`, `design/`, `docs/`, `DECISIONS.md`, `CRITICAL.md`.
Gitignored: `.claude/` (including `.claude/plans/`). Because plans are local,
`/implement` archives plan **substance** into `docs/features/*.md` + `DECISIONS.md`
— never a `Plan: .claude/plans/...` link (dead on other machines).

### Commands

- `/open` — top 3 open tasks (surfaces `- [!]` failed items)
- `/implement {task-id}` — implement, run the verification ladder, archive
- `/new-task` — add a critical issue to Sprint 0
- `/new-feature` — define a feature; writes requirements to `spec/`
- `/replan` — sprint transition; runs the T3 CUJ gate
- `/verify [cuj-id]` — run CUJ simulation(s) on demand
- `/status` — planning summary + live progress
- `/repos` — multi-repo registry (multi-repo workspaces)

### Checkbox states

`- [ ]` open · `- [x]` done · `- [!]` attempted-but-failed (awaiting follow-up).
All commands recognize all three; `/open` and `/status` surface `- [!]`.

### Task ID format

`S{sprint}-{feature}-{seq}` with a LOWERCASE feature slug — e.g. `S0-sec-1`,
`S1-infra-3`. Sprint 0 is the always-active triage lane. `TODO.md` carries a
counter comment `<!-- Counters: sec=N bug=N infra=N ... -->` for per-feature seq.

### Verification ladder (replaces the old "tests pass" gate)

- **T1 (every /implement — gates the commit):** project test + build +
  **lint/type-check** — run `{TEST_COMMAND}` (must include lint/type-check such as
  `ruff check` / `go vet`, not just the unit-test runner).
- **T2 (every /implement — gates flipping `- [x]`):** exercise the artifact
  against the task's own acceptance criteria. Files existing / build green is NOT done.
- **T3 (sprint-close via /replan + on-demand via /verify):** CUJ simulation.
  Driver per CUJ's `Driver:` field (code e2e harness OR LLM-agent sim). Judge =
  deterministic (state assertions + hard-fail traps) AND external LLM judge via
  `jeep` against the CUJ `Success Criteria`. Both must pass.

### CRITICAL escalation

Any task touching a path in `CRITICAL.md` auto-escalates: stronger model +
mandatory review before commit. `spec/` is protected — agents PROPOSE changes to
spec, never edit it during `/implement`.

### Multi-Repo (if applicable)

Multi-repo workspace: a central repo aggregates planning across subrepos, each
repeating this layout.

| File | Purpose |
|------|---------|
| `.repos.json` | Registry of subrepo subdirectories |
| `{repo}/TODO.md` | Repo-specific sprint tasks |
| `{repo}/spec/`, `{repo}/design/`, `{repo}/docs/` | Repo-specific docs |

**Context detection:** commands auto-detect central (has `.repos.json`) vs subrepo.
- **From central:** `/open` and `/status` aggregate across repos; `/new-task` and
  `/new-feature` ask which repo to target. Aggregated views prefix repo name: `[api] S0-bug-1`.
- **From subrepo:** commands scope to that repo only.
- `/repos` — list subrepos with counts; `add`/`remove`/`setup <dir>` manage them.
