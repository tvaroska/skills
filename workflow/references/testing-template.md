# {PROJECT_NAME} — Testing

Planning/ops doc (`docs/`). Documents how the verification ladder is realized in
this repo. The ladder — not "tests pass" — is the gate for commits and for
flipping tasks to done.

## Test command (T1)

```bash
{TEST_COMMAND}
```

T1 must run **test + build + lint/type-check** — not just the unit runner. Include
the linter/type-checker (e.g. `ruff check`, `go vet`, `tsc --noEmit`). A green
build with red lint is a T1 failure.

## Verification ladder

| Tier | What | When | Gates |
|------|------|------|-------|
| **T1** | project test + build + lint/type-check (`{TEST_COMMAND}`) | every `/implement` | the commit |
| **T2** | exercise the artifact against the task's acceptance criteria — run the thing, don't just assert files exist | every `/implement` | flipping `- [x]` |
| **T3** | CUJ simulation end-to-end + judged | sprint-close (`/replan`) + on-demand (`/verify`) | sprint transition |

## Strategy

- Unit tests for business logic.
- Integration tests for API endpoints / data flows.
- E2E tests / agent-sims for CUJs — these are the T3 **Drivers** declared in
  `spec/cujs.md` (code harness such as `tests/test_e2e_*.py`, or an agent-sim
  scenario emitting traces).

## Conventions

- Test files live in `tests/` (or alongside source, per repo convention).
- Name tests descriptively: `test_{what}_{condition}_{expected}`.
- Every new feature includes tests before T1 can pass.

## T3: CUJ simulation (Driver + Judge)

Run via `/verify [cuj-id]` (on demand) or `/replan` (sprint-close gate). For each
CUJ in `spec/cujs.md`:
- **Driver** — the harness command or agent-sim scenario from the CUJ's `Driver:` field.
- **Judge — both must pass:**
  - *Deterministic:* state assertions + weighted trace score + **hard-fail traps**.
  - *External LLM judge (`jeep`):* grades the run against the CUJ Success Criteria:
    `jeep --schema rubric.json --system "<grader>" -f criteria.txt -f run_output.txt --format json`.

`jeep` must be on PATH for the LLM-judge tier (github.com/tvaroska/jeep).

## How to add tests

1. Identify what to test (happy path, edge cases, error cases).
2. Write the test following existing patterns.
3. Run `{TEST_COMMAND}`; ensure no existing tests break.
4. For a new CUJ, add its `Driver:` and `Judge:` fields in `spec/cujs.md`.
