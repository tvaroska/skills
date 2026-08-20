---
description: Spec-driven codegen — regenerate project code from spec/ + design/ (powerful, use deliberately)
argument-hint: Optional area/module to scope the rebuild (default whole project)
---

# Rebuild — Spec-Driven Codegen

Regenerate the project's code from its **specifications** (`spec/`) and **design**
(`design/`). This is the most powerful and most speculative command in the
workflow: it treats `spec/` + `design/` as the source of truth and re-derives the
implementation from them.

**Read this before running.** `/rebuild` can rewrite large amounts of code. It only
pays off when the specs are genuinely complete and authoritative — otherwise it
will confidently generate the wrong thing. Use it deliberately: for a fresh
implementation from mature specs, a clean-room reimplementation, or recovering a
codebase that has drifted badly from its design. For incremental work, use
`/implement` instead. It always works on a branch and never edits `spec/`,
`design/`, or `DECISIONS.md` — those are its inputs.

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - Central → ask which repo to rebuild (rebuild is per-repo, not aggregate).
   - Inside a subrepo → rebuild this repo only.
   - Neither → single-repo mode.
2. If `$ARGUMENTS` names an area/module, scope the rebuild to it; otherwise the
   whole project is in scope.

## Step 1 — Verify spec/ Is Complete Enough to Build From

Do **not** generate code from thin specs. Read `spec/` and `design/` and check the
inputs are authoritative:

- **`spec/` present and substantive:** `cujs.md` (with per-CUJ Steps + Success
  Criteria + Supported By), `standards.md`, `contracts.md`, and any `demos/*.md`.
- **`design/` present:** `architecture.md`, `seams.md`/`zones.md`/`patterns.md` as
  applicable, plus `design/decisions/*.md` ADRs.
- **CUJs are testable:** every CUJ has concrete success criteria (so the result can
  be verified against `spec/`, not vibes).
- **Contracts are concrete:** data shapes / interfaces are specified, not TODO.
- **`open-questions.md`** contains no blocking unknowns for the scope in play.
- **No status/counts leaking into spec/design** (those live only in `TODO.md`).

**If specs are incomplete, STOP.** Do not generate code. Report the gaps as a
checklist and route the user to fix them first:

```
Cannot rebuild — spec/ is not complete enough to build from.

Gaps:
  - spec/cujs.md: CUJ "benefits-golden" has no Success Criteria
  - spec/contracts.md: DataPart schema is a TODO stub
  - design/architecture.md: missing (no design to generate from)
  - spec/open-questions.md: 3 open blockers touch this scope

Fix the specs first (see /new-feature to flesh out requirements), then re-run /rebuild.
```

If a `CRITICAL.md` path falls in scope, note it — rebuilding protected areas
(auth, payments, migrations) demands extra review before commit.

## Step 2 — Plan the Generation (show before executing)

With specs verified, present a build plan and confirm before generating:

- The **module/area map** to be (re)generated, derived from `design/architecture.md`
  (and `seams.md`/`zones.md` — respect seam boundaries and isolation invariants).
- The **build order** honoring dependencies (contracts/seams first, then core,
  then edges — mirror the design's own sequencing).
- **What is preserved vs regenerated** (see Step 3).
- The **verification** that will gate the result (Step 5).

Stop for user confirmation.

## Step 3 — Rebuild on a Branch (preserve the sources)

1. **Create a branch:**
   ```
   git switch -c rebuild-{scope}
   ```
   (Disambiguate with a suffix if it exists; report the name used.)
2. **Never touch the inputs.** `spec/`, `design/`, and `DECISIONS.md` are read-only
   here. Treat `spec/` as protected exactly as `/implement` does — propose spec
   changes, never edit them mid-rebuild.
3. **Generate code** module by module in dependency order, conforming to
   `contracts.md`, the seam/zone boundaries in `design/`, and `standards.md`.
   Keep test scaffolding and fixtures that the specs imply.
4. Preserve non-generated project files (build config, CI, `.gitignore`, license)
   unless the design says otherwise.
5. **Do not commit automatically** unless asked — leave the branch for review.

## Step 4 — Harvest a Lessons-Learned Entry into DECISIONS.md

A rebuild is a rich source of learning about spec quality. **Append** one entry to
`DECISIONS.md` (append-only; do not rewrite prior entries):

```
## {DATE} — Rebuild: {scope}

**Decision:** Regenerated {scope} from spec/ + design/ on branch {branch}.
**What the specs got right:** {…}
**Spec/design gaps surfaced during generation:** {ambiguities, missing contracts,
  under-specified CUJs — the things that made codegen guess}.
**Follow-ups:** {proposed spec/design edits, or /new-task items to file}.
```

This closes the loop: what a rebuild learns about the specs feeds back into making
the specs better (and the next rebuild cheaper).

## Step 5 — Verify Against the Specs

Files existing / build green is **not** done. Run the verification ladder:

- **T1:** project test + build + lint/type-check all green.
- **T2:** exercise the generated artifact against the CUJ **Success Criteria** in
  `spec/cujs.md` — prove the journeys actually work, not just that code compiles.
- **T3 (recommended after a full rebuild):** run `/verify` to play the relevant
  CUJ simulations end-to-end (deterministic + `jeep` LLM judge).

If any protected (`CRITICAL.md`) path was regenerated, require the mandatory review
before the branch is merged.

## Report

```
Rebuild complete → branch: {branch-name}  (not yet committed)

Scope:      {whole project | area}
Generated:  {N} modules ({list or count}) from spec/ + design/
Preserved:  spec/, design/, DECISIONS.md (inputs, untouched)
Verify:     T1 {pass/fail} · T2 {pass/fail against N CUJs} · T3 {run via /verify}
Learned:    DECISIONS.md entry appended ({N} spec gaps noted)
{CRITICAL:  protected paths regenerated — review required before merge}

Review the diff, then commit/merge when happy:
  git diff main...{branch-name}

Next: /verify to run CUJ simulations · address the DECISIONS.md spec gaps before
the next rebuild
```
