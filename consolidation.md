# Planning Workflow — Gen-3 Consolidation Design

**Date:** 2026-08-20
**Author:** Boris Tvaroska
**Supersedes:** `workflow.md` (2026-03-20 review that produced gen-2)
**Status:** Design — approved decisions, migration not yet executed

---

## 1. Background — three artifacts, two generations

The machine currently carries three planning artifacts across two lineages. Gen-2
(System B) was already the implementation of the `workflow.md` review of gen-1
(System A). This doc consolidates all three into a single gen-3 system.

| # | System | Lives in | Data file | Install | Commands |
|---|--------|----------|-----------|---------|----------|
| **A** | PLAN.md commands (gen-1, interactive) | `~/.claude/commands/*.md` | `PLAN.md` | Global user commands | `open`, `implement`, `status`, `new-task`, `new-feature`, `replan`, `feedback`, `user-test` |
| **B** | workflow plugin (gen-2, interactive) | `~/skills/workflow/` via `personal-plugin` marketplace | `TODO.md` | Plugin (`w`-prefixed) | `wopen`, `wimplement`, `wstatus`, `wnew-task`, `wnew-feature`, `wreplan`, `wrepos`, `wsetup` |
| **C** | plan-implement (autonomous orchestrator) | `~/.claude/workflows/plan-implement.js` | `PLAN.md` | Workflow script | single multi-agent entry |

### Maturity snapshot
- **A (legacy):** simple flat prompts. No multi-repo, staleness, ID counter,
  tests-gate, or setup. Uniquely owns `feedback` and `user-test`. `implement`
  does not archive (gap G1); `replan` is the heavyweight archiver.
- **B (mature interactive):** implements every `workflow.md` recommendation —
  archive-on-`implement` (R1), tests-gate (R5), staleness warnings (R7), ID
  counter (R4), 3-level `setup` (R9), consolidated Sprint 0 categories (R8), plus
  multi-repo (`.repos.json` + `repos`). Cost: the `w` prefix exists only to dodge
  A's global names.
- **C (strongest single asset, stranded):** 3-agent drain
  (Select/Haiku → Plan/Opus → Implement/chosen-model), per-task retry, `- [!]`
  flag-on-failure, budget-aware, scope filters. **Reads `PLAN.md`** — wired to the
  older file convention, incompatible with B.

---

## 2. Problems this consolidation resolves

1. **Two file conventions** (`PLAN.md` vs `TODO.md`) split repos into incompatible
   camps — and the best tool (C) sits on the older side.
2. **Naming collision** between A and B forced the `w` prefix.
3. **A third checkbox state** (`- [!]` from C) the interactive commands don't know.
4. **Orphaned capabilities:** `feedback` and `user-test` live only in A.
5. **ID format drift:** C/`replan` use `S1-sla-1` (lowercase feature area);
   B's `wnew-task` uses `S0-BUG-1` (uppercase category).

---

## 3. Approved decisions

| Decision | Choice | Consequence |
|----------|--------|-------------|
| **Canonical file** | **`TODO.md`** | Retarget `plan-implement.js` from `PLAN.md` → `TODO.md`. Everything else already assumes TODO.md. |
| **Naming / packaging** | **Drop `w` prefix, plugin-only** | Retire System A's global commands; rename `wopen → open`, etc., inside the plugin. One namespace, no collision. |
| **First deliverable** | **This design doc** | No command files edited until the plan below is agreed. |
| **Sharing / gitignore** | **`.claude/` (incl. `plans/`) stays local; `TODO.md`, `docs/`, `DECISIONS.md`, `CRITICAL.md` committed** | Plan files are machine-local, so `implement` must capture plan *substance* into the committed archive instead of relying on `Plan: .claude/plans/...` links (dead on other machines). |
| **Docs layout** | **Option A: `spec/` + `design/` at repo ROOT; `docs/` keeps planning/ops** | `spec/`=requirements/CUJs/standards/contracts (forkable, status-free, protected); `design/`=architecture/seams/patterns/ADRs; `docs/`=roadmap, runbooks, testing. Retires `wiki/` and flat-`docs/` conventions. Restructure `setup` templates + route content accordingly. |

---

## 4. Target gen-3 architecture

Single plugin (`workflow` in `personal-plugin`), one file convention, one command
namespace, interactive + autonomous sharing the same state.

### 4.1 Command surface (interactive)
Renamed from B (prefix dropped), plus the two capabilities rescued from A:

| Command | Origin | Notes |
|---------|--------|-------|
| `open` | B `wopen` | staleness warnings retained |
| `implement` | B `wimplement` | archive-on-complete + tests-gate retained |
| `status` | B `wstatus` | |
| `new-task` | B `wnew-task` | Sprint 0 triage |
| `new-feature` | B `wnew-feature` | |
| `replan` | B `wreplan` | sprint transition |
| `repos` | B `wrepos` | multi-repo registry |
| `setup` | B `wsetup` | 3 levels |
| `feedback` | **A (port)** | agency-review → FEEDBACK.md + Sprint 0. Retarget PLAN.md → TODO.md. |
| `user-test` | **A (port)** | dev-browser UX test → Sprint 0 bugs. Retarget PLAN.md → TODO.md. |
| `intake` | **new (§7.4)** | Take vague/incomplete user feedback → interview for clarity → route to `new-task` or `new-feature`. |
| `review` | **new (§7.3)** | Whole-project audit (health/architecture/docs) → findings into Sprint 0. |
| `rebuild` | **new (§7.7)** | Spec-driven codegen: regenerate project code from `spec/` + `design/`. |
| `verify` | **new (§7.8)** | Run CUJ simulation(s) end-to-end (per-repo driver) + judge (deterministic + `jeep` LLM judge). On-demand; also the sprint-close gate in `replan`. |

### 4.2 Autonomous layer
`plan-implement.js` becomes `todo-implement` (or keep name, retarget file):
- Read/write `TODO.md` instead of `PLAN.md` throughout (schemas, prompts, flag agent).
- Keep the 3-agent drain, retry, budget logic unchanged — they're solid.
- Align to the shared checkbox and ID conventions below.

### 4.3 Shared conventions (unify the drift)

**Checkbox states** — canonical set, understood by *all* commands and the orchestrator:
- `- [ ]` open
- `- [x]` done
- `- [!]` attempted-but-failed (from autonomous runs; interactive `open`/`status`
  must surface these, `implement` may pick one up to retry).

**Task ID format** — pick one and enforce everywhere. Recommend the review's
`S<sprint>-<feature>-<seq>` with a **lowercase** feature slug
(`S0-sec-1`, `S1-infra-3`), reconciling B's uppercase category with C/`replan`.
`setup`'s ID counter comment tracks per-feature sequence.

---

## 5. Migration plan (execution order — not yet run)

1. **Rescue A's uniques.** Copy `feedback.md` + `user-test.md` into
   `workflow/commands/`, retarget `PLAN.md` → `TODO.md`, add plugin frontmatter,
   align Sprint 0 ID format.
2. **Drop the `w` prefix.** Rename all `w*.md` command files; update internal
   self-references (each command mentions sibling commands like `/open`).
3. **Retarget the orchestrator.** `plan-implement.js`: `PLAN.md` → `TODO.md`
   everywhere; verify `- [!]` flag agent + ID assumptions match §4.3.
4. **Unify conventions.** Sweep all commands + templates for checkbox states and
   ID format; make `open`/`status` render `- [!]`.
5. **Retire System A.** Remove `~/.claude/commands/*.md` (the eight global
   commands) so only the plugin namespace remains. Keep a backup.
6. **Docs.** Fold `workflow.md` history into this doc's appendix; refresh the
   plugin/marketplace descriptions; note the gen-2→gen-3 change.
7. **Per-repo migration.** Repos still on `PLAN.md` need `PLAN.md → TODO.md`
   (rename + section-format check). Decide: one-shot script vs. `setup --migrate`.
8. **New artifacts + commands (from §7).** Add `DECISIONS.md` (7.1) and
   `CRITICAL.md` (7.5) to `setup`; wire `implement`/`plan-implement` to append to
   the former and consult the latter. Restructure docs into `spec/` +
   `design/` (7.6). Add `intake` (7.4) and `review` (7.3) commands. Fix the
   `Plan:` link → committed-substance archive behavior (7.2).
9. **`rebuild` track (7.7).** Spec-driven codegen — separate track, sequence
   last, gated on docs restructure being trustworthy.

### Open items to decide before/while executing
- **Orchestrator name:** keep `plan-implement` (retargeted) or rename to
  `todo-implement`? (Renaming breaks any muscle memory / saved invocations.)
- **Per-repo `PLAN.md` files:** how many repos are affected, and do we migrate
  them automatically or lazily on next `setup`?
- **ID format final call:** lowercase-feature `S0-sec-1` vs. keep B's uppercase
  `S0-SEC-1` and instead fix C/`replan` to match B.

---

## 7. Feedback-driven additions (from `SKILL.txt`)

`SKILL.txt` is high-level feedback on the current systems. Each item below was
clarified in interview (2026-08-20) and is now part of gen-3 scope.

### The "issue line" (how these connect)
End-to-end path a piece of feedback travels; the new stations are marked ★:

`capture ★(intake/feedback/user-test/review) → interview → route (new-task | new-feature)
→ escalate if in CRITICAL.md ★ → implement / plan-implement → log to DECISIONS.md ★ → archive`

### 7.1 Learning & decision log — `DECISIONS.md` (item 1)
- **Append-only `DECISIONS.md` per repo, committed.** Agents read it before working
  and append decisions + learnings after. Feeds context to `implement` and
  `plan-implement`.
- `setup` seeds it; `implement`/`plan-implement` append an entry per task
  (decision, rationale, gotchas). This is the *committed* home for the reasoning
  that today lives only in machine-local `.claude/plans/` files.

### 7.2 Gitignore / sharing policy (item 2)
- **Not shared (gitignored):** `.claude/` including `.claude/plans/`.
- **Shared (committed):** `TODO.md`, `docs/`, `DECISIONS.md`, `CRITICAL.md`,
  `FEEDBACK.md`.
- **Fix required:** because plan files are local, `implement`'s archive step must
  copy the plan's substance into the committed `docs/features/*.md` (and/or
  `DECISIONS.md`) rather than emit a `Plan: .claude/plans/...` link that dies on
  other machines. Sweep existing commands for that link convention.

### 7.3 `review` command — whole-project audit (item 3)
- Broad audit of project health / architecture / docs (sibling to `feedback`,
  which is agency-framed). Emits findings as Sprint 0 tasks with proper IDs.
- Consider reusing existing `/code-review` / `/security-review` skills for the
  code-level portion; `review` owns the project-level synthesis.

### 7.4 `intake` command — feedback → clarity → task/feature (item 4)
- Takes **vague, incomplete user feedback** and runs an **AskUserQuestion
  interview** to establish: real problem, severity, bug-vs-feature.
- Routes the result: critical/bug → `new-task` (Sprint 0); feature → `new-feature`
  (backlog/specs). No separate inbox artifact — the interview *is* the triage.

### 7.5 Critical parts — `CRITICAL.md` registry (item 5)
- **Committed `CRITICAL.md` registry of sensitive files/areas** (auth, payments,
  migrations, etc.).
- Any task touching a listed path **auto-escalates scrutiny**: `plan-implement`
  picks a stronger model and a mandatory review/tests-gate before commit.
- `setup` seeds it; `implement`/`plan-implement` consult it during planning.

### 7.6 Documentation restructure — Option A (item 6)
- **Three homes, chosen 2026-08-20:**
  - `spec/` (repo root) — requirements, the *what*: `cujs.md`, `standards.md`,
    `contracts.md`, `demos/*.md`, `open-questions.md`. **Forkable, status-free,
    protected** (list in `CRITICAL.md`; agents propose, never edit during
    `implement`).
  - `design/` (repo root) — the *how it's built*: `architecture.md`, `seams.md`,
    `zones.md`, `patterns.md`, `decisions/*.md` (ADRs). Pairs with `DECISIONS.md`.
  - `docs/` — planning/ops: `roadmap.md`, `runbooks/*.md`, `testing.md`.
- **Replaces** two inconsistent conventions seen in the wild: docbride3's `wiki/`
  (34 `bridge-*.md`, spec+design mixed) and document-bridge's flat `docs/`
  (everything jumbled). Keep status/counts OUT of `spec/`+`design/` (F6) — live
  status lives only in `TODO.md`.
- Update `setup` templates and every command that reads/writes docs: `new-feature`
  writes requirements to `spec/`; decisions land in `design/decisions/` +
  `DECISIONS.md`.

### 7.7 `rebuild` — spec-driven codegen (item 7)
- A skill that **regenerates the project's code from `spec/` + `design/`.**
- Depends on 7.6 being solid (specs must be complete/authoritative enough to
  build from). Largest, most speculative item — sequence it last.

### Scope note
Items 7.1–7.6 extend the planning system incrementally. 7.7 (`rebuild`) is a
distinct, ambitious capability that only pays off once specs are trustworthy;
treat it as a separate track, not a blocker for consolidation.

### 7.8 Verification ladder (expands F1 — the top lever)

F1 showed "build/tests green" ≠ "task done." Gen-3 replaces the single unit-test
gate with a **three-tier ladder**, each tier at a different point in the workflow.

| Tier | What | When | Gate for |
|------|------|------|----------|
| **T1 Build/unit** | project test + build + **lint/type-check** (add `ruff`/`vet` — F1) | every `implement` | commit |
| **T2 Acceptance** | exercise the artifact against the *task's own* success criteria — run the thing, not just assert files exist (F1) | every `implement` | flip `- [x]` |
| **T3 CUJ simulation** | play the relevant Critical User Journey end-to-end and judge it | **sprint-close (`replan`) + on-demand (`verify`)** | sprint transition |

**T3 design (from decisions 2026-08-20):**

- **Driver — per-repo, whichever exists.** Each CUJ declares its driver; the
  workflow uses whatever the repo provides, no forced rewrite:
  - *code e2e harness* (document-bridge `tests/test_e2e_*.py`, `E2EHarness` with
    fakes) — deterministic, real orchestrators over shared stores; **or**
  - *LLM-agent sim* (agent-gym `agents/run_scenarios.py`) — a real agent plays the
    journey and emits OTLP traces.
- **Judge — both deterministic AND an external LLM judge.**
  - *Deterministic must-pass:* state assertions + optional weighted trace score +
    **hard-fail traps** (e.g. agent-gym's uncaught-E&O trap caps score at 0).
    This is what your repos already do — keep it.
  - *External LLM judge via `jeep`:* score the run against the CUJ **Success
    Criteria** rubric — `jeep --schema rubric.json --system "<grader>" "grade this
    run" -f criteria.txt -f run_output.txt --format json`. Covers subjective /
    output-quality journeys (F5) that deterministic assertions miss. jeep is the
    inference primitive only; the workflow owns the rubric + aggregation +
    pass/fail. **Both judges must pass.**
- **When — sprint-close / on-demand only** (CUJ sims are expensive). `replan` runs
  the full suite as a pre-transition gate; a new **`verify [cuj-id]`** command runs
  one or all on demand. *Not* run per task — but the task→CUJ map (`Supported By`
  in `cujs.md`) tells `replan` which journeys the sprint touched.

**Requires:** extend `cujs-template.md` with two fields per CUJ — `Driver:`
(harness command or agent-sim scenario id) and `Judge:` (rubric criteria +
hard-fail traps) — on top of the existing Steps / Success Criteria / Supported By.
Add `verify` to the command surface (§4.1). External dependency: `jeep`
(github.com/tvaroska/jeep) available on PATH for the LLM-judge tier.

---

## 9. Evidence from usage (session mining, 2026-08-20)

Mined ~1,900 transcripts across the heaviest repos (working, document-bridge,
docbride3, learning-audi, planning, products, skills). Three independent agents
converged on the same top findings.

### Usage reality
- Real usage is **System A (PLAN.md)**: `/open` 923, `/implement` 736, `/replan`
  52, `/feedback` 43. The `w`-prefixed System B is ≈0; `/plan-implement` 4,
  `/status` 3, `/setup` 3. Even the newest repo (learning-audi, Aug 2026) used
  `PLAN.md` 160× vs `TODO.md` 5×.
- **Adoption lesson:** the draw is `plan-implement` + short command names + **zero
  ceremony**. `/setup`/`/status` overhead went unused. Gen-3 must stay
  low-ceremony or it won't be adopted — same reason B wasn't.

### Ranked findings → workflow changes

**F1 — The tests-gate is insufficient (highest impact; all 3 agents).**
Build/tests pass while the product is broken. learning-audi: orchestrator
reported "16 implemented, 0 failed" but the audiobook body had collapsed
(~1.9 min/chapter) — `go build`/`go test` gated, acceptance did not. working:
`/implement` checked *files exist*, not that the task *runs*; and ran `pytest`
but never `ruff check`, so commits landed with red CI.
→ Gate on **acceptance criteria (exercise the artifact) + lint/type-check**, not
just the unit-test command, before flipping `- [x]`.

**F2 — Autonomous runs have no observability; users poll constantly.**
Repeated "how long?", "is it done?", "best guess when it finishes?"; Claude
hand-parsed commit timestamps and even spun ad-hoc cron watchers.
→ `plan-implement` needs a **live progress/ETA surface** (done/open/failed,
tokens, pace-based ETA) readable via `/status`.

**F3 — Orchestrator truncates and mis-reports; needs auto-resume + reconciliation.**
Stopped at 6 of ~19 tasks after an `agents_error`; needed manual relaunch; result
payload claimed 6 done when a 7th was actually committed.
→ Loop re-reading TODO.md until 0 open; **reconcile claimed-done against actual
`- [x]` + git commits**; don't trust the in-memory summary.

**F4 — `.claude/plans/` handling is inconsistent; dead links confirmed.**
working: plans git-**tracked**, bloated history (user nuked history twice), random
slugs (`reflective-whistling-teacup.md`) → dead `Plan:` links. learning-audi:
plans untracked, correct `{task-id}-{slug}` naming.
→ Confirms **gitignore `.claude/plans/`** (7.2); additionally **enforce
`{task-id}-{slug}` naming**, verify file exists before linking, and archive plan
**substance** into committed files (not a link).

**F5 — Subjective/quality tasks need a human-review gate.**
Even after "complete", the user had to judge output ("good narration but too
long", "don't generate Cover/Copyright").
→ Mark quality/subjective tasks so `implement` **pauses for review** instead of
auto-archiving. (New — not in the original 7.)

**F6 — Design docs accumulate stale status/counts.**
Whole sessions spent stripping status from wiki/README ("README claims 772 — a
stale count"). User codified: design docs status-free; status lives in the plan.
→ Reinforces the `docs/spec` + `docs/design` split (7.6): **keep counts/status
out of design docs**; only TODO.md carries live status.

**F7 — Prose plans block first launch.**
`plan-implement` requires an undocumented `- [ ]` checklist with IDs and no-ops on
prose plans; user had to hand-convert.
→ Detect prose plans and offer/auto-run a **prep-convert step**; document the
required format. (New.)

**F8 — Opaque branch behavior.**
48 commits landed on a feature branch and surprised the user.
→ Orchestrator should **report the target branch at launch** and offer
merge/cleanup on completion. (New.)

**F9 — Manual link-integrity sweeps.**
Repeated grep passes for dangling `[[wiki-links]]` and refs to deleted files —
same class as dead `Plan:` links.
→ Add a **link-verification step** to `implement`/`replan`. (New.)

**F10 — Ad-hoc per-sprint scripts diverge from canonical workflow.**
A one-off `sprint0-plan-implement` mis-checked-off 3 of 4 tasks (root cause of F1
in that repo).
→ **Forbid bespoke scripts; parametrize the one canonical orchestrator.**

**F11 — Confirms the 7 SKILL.txt items with real precedent:** DECISIONS/learning
log emerged manually via memory files (7.1); `/review` for spec-vs-impl drift and
validation interviews wanted (7.3); feedback-as-interview (7.4); `wiki/` guarded
read-only as protected spec (7.5, CRITICAL.md); spec-driven rebuild is repeated
explicit intent (7.7).

### New scope items surfaced (add to §5 migration)
- **Verification ladder** (F1, §7.8) — T1 add lint/type-check; T2 acceptance
  execution; T3 CUJ simulation (`verify` cmd + `replan` gate, `jeep` judge).
- **Autonomous observability** (F2, F3, F8) — progress/ETA, auto-resume +
  reconciliation, branch reporting.
- **Human-review gate** for subjective tasks (F5).
- **Prose→checklist prep** step (F7).
- **Link-integrity check** in implement/replan (F9).
- **One canonical orchestrator, no bespoke scripts** (F10).

### Strategic implication
The single biggest lever is **F1 (real verification)** — it's the difference
between "the agent said done" and "it's actually done," and it recurred in every
repo. Prioritize it above the cosmetic consolidation. Second lever: keep
ceremony near-zero (adoption lesson) — resist over-building `setup`.

---

## 8. What we are deliberately NOT changing
- The 3-agent structure and model-selection logic in the orchestrator — proven.
- The multi-repo `.repos.json` model — no simpler alternative found.
- The 3-level `setup` tiers — good fit for the range of repos.
- Sprint 0 as the always-active triage lane.
