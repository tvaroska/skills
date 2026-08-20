---
description: Implement a task from TODO.md through the verification ladder, then archive it
argument-hint: Task ID (e.g., S1-be-3) — optionally prefixed with [repo] in multi-repo
---

# Implement Task

Implement task `$ARGUMENTS` from TODO.md. A task is **not done because files
exist or the build is green** — it is done only when it has climbed the
verification ladder (T1 then T2) and its substance has been archived into
committed history. Keep ceremony low; spend the effort on real verification.

## Phase 0: Resolve Repo

1. **Parse `$ARGUMENTS`** for an optional repo prefix: `[repo-name] S1-be-3` or just `S1-be-3`.

2. **Detect context:**
   - `.repos.json` in the current directory → **central repo**
   - a parent directory has `.repos.json` → **inside subrepo**
   - neither → **single-repo mode**

3. **Resolve target repo and TODO.md path:**
   - **Single-repo / subrepo:** use the current directory's TODO.md
   - **Central with repo prefix:** use `{repo.path}/TODO.md`
   - **Central without prefix:** search all TODO.md files (central + subrepos) for the task ID
     - found in exactly one → use that repo
     - found in multiple → ask user which repo
     - not found → inform user and run `/open`

4. Set `{target-dir}` to the resolved repo directory for all subsequent file operations.

## Phase 1: Load Context

1. **Find the task in `{target-dir}/TODO.md`**, accepting either state:
   - `- [ ]` open — normal path.
   - `- [!]` attempted-but-failed — a **retry**. Read any failure note recorded
     with the task; treat prior findings as input, not a fresh start.
   - If the task ID isn't found, inform the user and run `/open`.
   - Capture: description, files, dependencies, and the task's **acceptance criteria**.
   - If it has dependencies, confirm they are `- [x]`. If blocked, tell the user and stop.

2. **Read committed project context** from `{target-dir}/` (skip any that are absent):
   - `DECISIONS.md` — prior decisions/learnings/gotchas. Read this BEFORE planning.
   - `spec/cujs.md` — the CUJ(s) this task supports (note the `Supported By` map).
   - `spec/standards.md`, `spec/contracts.md` — requirements the work must honor.
   - `design/architecture.md`, `design/seams.md`, `design/patterns.md` — how it's built.
   - `docs/testing.md` — test conventions and the project test command.

3. **Consult `{target-dir}/CRITICAL.md`.** Note whether any file the task will
   touch (or any `spec/` path) is listed — this drives escalation in Phase 2.

## Phase 2: Plan

4. **Enter planning mode** (EnterPlanMode) and produce a plan:
   - Plan file: `.claude/plans/{task-id}-{slug}.md` (in the central/CWD `.claude/`,
     which is gitignored). Enforce the `{task-id}-{slug}.md` name — no random slugs.
   - Break the task into concrete steps; list files to read / modify / create
     (within `{target-dir}/`); state how each **acceptance criterion** will be
     exercised (the T2 plan), and the T1 commands (test, build, lint/type-check).

5. **CRITICAL escalation** — if Phase 1 flagged a `CRITICAL.md` path:
   - Use the **strongest available model** for this task.
   - A **mandatory review** of the diff is required before the Phase 4 commit
     (self-review at minimum; prefer `/review` or the human if available).
   - **`spec/` is protected: never edit it during `/implement`.** If the work
     implies a spec change, do NOT touch `spec/` — instead record a PROPOSAL
     (append to `spec/open-questions.md` or note it in the report) and continue
     against the current spec.

## Phase 3: Execute + Verification Ladder

6. **Implement the plan** — write/modify code within `{target-dir}/` only.

7. **T1 gate — required before any commit.** Run all of, and they must pass:
   - project **test** command,
   - project **build**,
   - **lint / type-check** (e.g. `ruff check`, `go vet`, `tsc --noEmit`, `eslint`).
   Lint/type-check is not optional — a green test run alone does NOT satisfy T1.
   If anything fails, fix it. Do not proceed to commit with T1 red.

8. **T2 gate — required before flipping `- [x]`.** Execute the task's **acceptance
   criteria**: actually exercise the artifact and prove the behavior (run the CLI,
   hit the endpoint, invoke the function with real inputs, render the output).
   **"Files exist" / "build is green" is NOT done.** Capture the evidence.
   - If a criterion cannot be met, do NOT mark `[x]`. Instead set the task to
     `- [!]` with a short failure note, record findings in the plan, skip
     archiving, commit only if T1 is green and the partial work is safe, and
     report the failure. (This mirrors what an autonomous run does, and `/open`
     will surface it for retry.)
   - **Subjective / quality tasks** (narration quality, visual output, wording):
     T2 can't be fully automated — pause and ask the user to confirm acceptance
     before flipping `[x]`.

## Phase 4: Complete and Archive

Only reached when T1 and T2 both pass.

9. **Mark done in `{target-dir}/TODO.md`:** change `- [ ]` (or `- [!]`) to `- [x]`
   and add the completion date.

10. **Archive the plan's SUBSTANCE into committed files** (plan files are
    gitignored — a `Plan: .claude/plans/...` link is dead on other machines, so
    do NOT emit one as durable history):
    - Append to the matching `{target-dir}/docs/features/{area}.md` "Completed
      Work" section: task ID, description, date, **what was built, key approach,
      and the T2 acceptance evidence**. Match the feature area from the task ID's
      feature slug (Sprint 0: SEC/BUG/INFRA/PERF → `production-readiness.md`).
      Create the file from `${CLAUDE_PLUGIN_ROOT}/references/feature-template.md` if absent.
    - Append an entry to `{target-dir}/DECISIONS.md`: the decision made, its
      rationale, and any gotchas/learnings for future tasks.
    - If the task changed architecture, add/append an ADR under
      `{target-dir}/design/decisions/`.

11. **Remove the completed task line** from `{target-dir}/TODO.md`.

12. **Git commit:**
    - If this task hit CRITICAL escalation, complete the mandatory review first.
    - Stage changed files; commit with a short message (max 2 lines, no author mention).
    - If in a subrepo with its own `.git`, commit there.

## Phase 5: Report

13. **Sprint completion check:** count remaining `- [ ]` in the current sprint of
    `{target-dir}/TODO.md`. If zero: "Sprint {N} is complete. Run /replan to run
    the CUJ verification suite and start the next sprint."

14. **Report:**
    ```
    Task {Task-ID} complete: {Description}
    {Repo: {repo-name} — if multi-repo}

    Verification:
    - T1: tests / build / lint — passed
    - T2: {acceptance criterion} — {how it was exercised, result}

    Changes:
    - {list of files modified}

    Archived to: {target-dir}/docs/features/{area}.md
    Logged to:   {target-dir}/DECISIONS.md
    {Spec change PROPOSED (not applied): ... — if any}
    {CRITICAL path touched; reviewed before commit — if any}
    ```
    On the failure path instead: report which criterion failed, that the task is
    now `- [!]`, and suggest `/implement {Task-ID}` to retry.
