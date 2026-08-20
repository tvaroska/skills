# Gen-3 Workflow — Authoring Conventions (SINGLE SOURCE OF TRUTH)

Every command file, template, and the orchestrator MUST follow these conventions.
Rationale for each choice is in `/home/boris/skills/consolidation.md`. This file is
the contract; when in doubt, match it exactly so files don't drift.

## Canonical per-repo layout (Option A)
```
TODO.md          # tasks + LIVE STATUS (the ONLY place status/counts live)
DECISIONS.md     # append-only learning/decision log (committed)
CRITICAL.md      # registry of protected/sensitive files/areas (committed)
CLAUDE.md        # has the workflow section
spec/            # THE WHAT — requirements. Forkable, STATUS-FREE, PROTECTED.
  cujs.md  standards.md  contracts.md  demos/*.md  open-questions.md
design/          # THE HOW (built): architecture.md seams.md zones.md patterns.md
  decisions/*.md # ADRs
docs/            # planning/ops: roadmap.md  runbooks/*.md  testing.md
  features/*.md  # completed-work archive
.claude/plans/   # per-task plans — LOCAL, gitignored, naming {task-id}-{slug}.md
```
Multi-repo: `.repos.json` registry + `/repos` command; each subrepo repeats this layout.

## Checkbox states (ALL commands recognize all three)
- `- [ ]` open   ·   `- [x]` done   ·   `- [!]` attempted-but-failed (awaiting follow-up)
`/open` and `/status` MUST surface `- [!]` items. `/implement` may pick a `- [!]` up to retry.

## Task ID format
`S<sprint>-<feature>-<seq>`, feature = short LOWERCASE slug: `S0-sec-1`, `S1-infra-3`.
Sprint 0 = always-active triage lane. TODO.md carries a counter comment
`<!-- Counters: sec=N bug=N infra=N ... -->` for per-feature sequence.

## Verification ladder (REPLACES the old "tests pass" gate)
- **T1 (every /implement — gates the commit):** project test + build + **lint/type-check**
  (e.g. `ruff check`/`go vet`, not just `pytest`/`go test`).
- **T2 (every /implement — gates flipping `- [x]`):** run the ACCEPTANCE CRITERIA —
  exercise the artifact, prove it works. Files existing / build green is NOT done.
- **T3 (sprint-close via /replan + on-demand via /verify):** CUJ simulation.
  Driver per-repo per CUJ's `Driver:` field (code e2e harness OR LLM-agent sim).
  Judge = deterministic (state assertions + trace + hard-fail traps) AND external
  LLM judge via `jeep` (`jeep --schema rubric.json --system "<grader>" -f criteria.txt
  -f run_output.txt --format json`) against the CUJ `Success Criteria`. BOTH must pass.

## Archiving on completion (/implement)
- Capture the plan's SUBSTANCE into `docs/features/{area}.md` and append a
  DECISIONS.md entry. Do NOT emit a `Plan: .claude/plans/...` link as durable
  history — those files are local/gitignored (dead on other machines).
- Enforce `{task-id}-{slug}.md` plan naming; verify the file exists before referencing.
- Remove the completed task line from TODO.md after archiving.

## CRITICAL escalation
Any task touching a path listed in `CRITICAL.md` auto-escalates: stronger model +
mandatory review before commit. `spec/` is protected — agents PROPOSE changes to
spec, never edit it during `/implement`.

## Command file style
- Markdown with frontmatter: `description:` and (if it takes args) `argument-hint:`.
- Command NAMES are unprefixed (`open`, `implement`, …). Reference siblings as `/open`.
- Keep context-detection (single-repo / central+.repos.json / inside-subrepo) exactly
  as gen-2 did. Keep ceremony LOW — usage evidence shows heavy setup/status is unused.
- Read templates from the plugin `references/` dir via `${CLAUDE_PLUGIN_ROOT}/references/`
  (robust across install paths; bare relative paths are fragile since commands run
  with cwd = the user's repo, not the plugin dir).

## Naming decisions
- Interactive commands (plugin, global, unprefixed): open, implement, status,
  new-task, new-feature, replan, setup, repos, feedback, user-test, intake, review,
  verify, rebuild, realign.
- Autonomous orchestrator (workflow script): `implement-all` (was plan-implement;
  now TODO.md + full verification ladder + auto-resume/reconcile + branch reporting).
- `/realign` = brownfield migration to gen-3 (dry-run plan first, then a new branch).
- `/setup` = greenfield init. `/rebuild` = spec-driven codegen from spec/+design/.
