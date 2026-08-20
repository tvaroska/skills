# {PROJECT_NAME} — Critical User Journeys

End-to-end flows that matter most. Every feature should support at least one CUJ.
This file is part of `spec/` — the forkable, **status-free** source of truth.
Keep counts/status out of here; live status lives in `TODO.md`.

Each CUJ carries, on top of Description / Steps / Success Criteria / Supported By,
two fields the verification ladder's T3 tier consumes:
- **Driver:** how the journey is played end-to-end — a code e2e harness command
  OR an LLM-agent-sim scenario id. `/verify` and `/replan` use whatever the repo
  provides; no forced rewrite.
- **Judge:** how a run is scored — the deterministic must-pass assertions +
  **hard-fail traps**, plus the rubric criteria handed to the external LLM judge
  (`jeep`) against the Success Criteria. BOTH judges must pass.

---

## CUJ-1: [Primary User Journey]

**Description:** [What the user is trying to accomplish, and why it matters.]

**Steps:**
1. User does X
2. System responds with Y
3. User completes Z

**Success Criteria:**
- [measurable outcome — this is the rubric the LLM judge grades against]
- [latency / correctness / UX bound]

**Supported By:** [features / sprints / components that deliver this]

**Driver:** [ONE of:
  - code e2e harness — e.g. `pytest tests/test_e2e_primary.py::test_happy_path`
  - agent-sim scenario — e.g. `agents/run_scenarios.py --scenario cuj-1`]

**Judge:**
- *Deterministic (must-pass):* [state assertions — e.g. "artifact delivered,
  task state == DONE"; optional weighted trace score]
- *Hard-fail traps:* [conditions that cap score at 0 — e.g. "any uncaught error",
  "wrote to a protected path", "secret leaked in trace"]
- *LLM-judge rubric:* [subjective/quality criteria graded via `jeep` against
  Success Criteria — e.g. "output is complete, correctly formatted, no hallucinated fields"]

---

## CUJ-2: [Secondary User Journey]

**Description:** ...

**Steps:**
1. ...

**Success Criteria:**
- ...

**Supported By:** ...

**Driver:** ...

**Judge:**
- *Deterministic (must-pass):* ...
- *Hard-fail traps:* ...
- *LLM-judge rubric:* ...
