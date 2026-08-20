---
description: Run Critical User Journey simulation(s) end-to-end and judge them (deterministic + jeep LLM judge)
argument-hint: Optional CUJ id (e.g. CUJ-2); omit to run all CUJs
---

# Verify — CUJ Simulation (Tier 3)

Run the T3 tier of the verification ladder **on demand**: play the relevant Critical
User Journey(s) end-to-end and judge whether they actually work. `/replan` runs this
full suite as a sprint-close gate; this command runs one CUJ or all of them any time.

Target CUJ: $ARGUMENTS (empty ⇒ run **all** CUJs)

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: AskUserQuestion which repo to verify (or "all").
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: verify current repo.
   - If neither → **single-repo mode**: verify current directory.
2. Resolve `{target-dir}` per repo in scope.

## Phase 1: Select CUJs

1. Read `{target-dir}/spec/cujs.md`.
2. If `$ARGUMENTS` names a CUJ id, select only that one; else select all CUJs.
3. For each selected CUJ, extract its fields:
   - **Steps** and **Success Criteria** (the rubric the LLM judge grades against).
   - **Driver:** — how to run it (a code e2e harness command OR an LLM-agent sim scenario id).
   - **Judge:** — deterministic rubric criteria + hard-fail traps.
   - **Supported By:** — features/sprints this journey exercises.
4. If a CUJ lacks a `Driver:` or `Judge:` field, report it as **not runnable** and
   suggest adding the fields (this is a `review`/`new-feature` gap), then skip it.

## Phase 2: Run the driver (per CUJ)

Use whichever driver the CUJ declares — never force a rewrite:
- **Code e2e harness** (e.g. `tests/test_e2e_*.py`, an `E2EHarness` over shared
  stores with fakes): run the command from `Driver:`; deterministic, real
  orchestrators. Capture exit status, assertion results, and any trace it emits.
- **LLM-agent sim** (e.g. `agents/run_scenarios.py <scenario>`): a real agent plays
  the journey and emits OTLP traces. Run the scenario from `Driver:`; capture the
  trace and final state.

Persist each run's output to a file (e.g. `run_output.txt`) — it feeds both judges.

## Phase 3: Judge (BOTH must pass)

A CUJ **passes only if both judges pass.**

1. **Deterministic (must-pass):**
   - State assertions from the driver/harness.
   - Optional weighted trace score from the emitted trace.
   - **Hard-fail traps** — e.g. an uncaught error-and-omission caps the score at 0.
   - Any hard-fail trap tripped ⇒ deterministic FAIL regardless of other signals.

2. **External LLM judge via `jeep`** (github.com/tvaroska/jeep, must be on PATH):
   Grade the run against the CUJ **Success Criteria**. Write the criteria to
   `criteria.txt` and a grading rubric to `rubric.json`, then:
   ```
   jeep --schema rubric.json --system "<grader instructions for this CUJ>" \
        -f criteria.txt -f run_output.txt --format json
   ```
   `jeep` is the inference primitive only — this command owns the rubric,
   aggregation, and the final pass/fail threshold. Parse the JSON result and apply
   the threshold to decide LLM-judge pass/fail.

## Phase 4: Report (per CUJ)

```
Verify — {repo context line if multi-repo}

CUJ        Driver              Deterministic   LLM judge (jeep)   Result
──────────────────────────────────────────────────────────────────────
CUJ-1      e2e harness         PASS            PASS (0.91)        PASS
CUJ-2      agent-sim           FAIL (trap)     PASS (0.80)        FAIL
...

{N} passed / {M} failed   ({X} not runnable — missing Driver/Judge)

Failures:
  CUJ-2: {which judge failed and why — e.g. uncaught-E&O trap tripped}

Next: /new-task to log failures as Sprint 0 bugs, or fix and re-run /verify {cuj-id}
```

Do NOT flip any TODO.md checkboxes here — `/verify` reports; logging failures as
tasks is a follow-up via `/new-task`. When invoked by `/replan` at sprint close, a
failing suite blocks the sprint transition.
