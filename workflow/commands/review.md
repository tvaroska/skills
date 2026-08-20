---
description: Whole-project audit (health, architecture, docs, spec-vs-implementation drift) → Sprint 0 tasks
argument-hint: Optional focus area (e.g. "architecture", "docs", "drift") or repo name (multi-repo)
---

# Review — Whole-Project Audit

Broad audit of project **health, architecture, and documentation**, with special
attention to **spec-vs-implementation drift**. This is the neutral, project-level
sibling of `/feedback` (which is agency-framed). It emits its findings as Sprint 0
tasks with proper lowercase-feature IDs.

`review` owns the **project-level synthesis**. For code-level depth it may reuse the
existing `/code-review` and `/security-review` skills rather than re-deriving them.

Focus / scope: $ARGUMENTS

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: if `$ARGUMENTS` names a repo, audit that one;
     otherwise AskUserQuestion which repo (or "all") to audit.
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: audit current repo.
   - If neither → **single-repo mode**: audit current directory.
2. Resolve `{target-dir}` per repo in scope.

## Phase 1: Read the sources of truth

Read whatever exists in `{target-dir}/`:
- **spec/** (THE WHAT): `cujs.md`, `standards.md`, `contracts.md`, `demos/*.md`,
  `open-questions.md` — the requirements the implementation is measured against.
- **design/** (THE HOW): `architecture.md`, `seams.md`, `zones.md`, `patterns.md`,
  `decisions/*.md` (ADRs).
- **docs/**: `roadmap.md`, `runbooks/*.md`, `testing.md`, `features/*.md`.
- `DECISIONS.md` (learning/decision log), `CRITICAL.md` (protected areas),
  `TODO.md` (live status — the only place counts should live).

## Phase 2: Audit dimensions

Assess each, gathering concrete evidence (file paths, symbols, line refs):

1. **Spec-vs-implementation drift** — for each CUJ / contract / standard in `spec/`,
   does the code actually implement it? Flag: specced-but-missing,
   implemented-but-unspecced, and behaviour that contradicts the spec.
2. **Architecture health** — does the code match `design/architecture.md` +
   `seams.md` + `patterns.md`? Flag boundary violations, god modules, missing
   seams, patterns applied inconsistently.
3. **Documentation health** — is `spec/`/`design/` status-free and current? Flag
   stale counts/status leaking into design docs (they belong only in TODO.md),
   dead links, ADRs missing for decisions visible in the code, `open-questions.md`
   items already resolved (or silently ignored).
4. **Code-level depth (delegate):** run `/code-review` for correctness/quality and
   `/security-review` for security. Fold their findings into this synthesis — do
   not duplicate them verbatim; reference and prioritize them at the project level.
5. **Test/verification health** — do CUJs in `spec/cujs.md` have `Driver:` and
   `Judge:` fields so `/verify` can run them? Flag CUJs that cannot be simulated.

## Phase 3: Emit findings as Sprint 0 tasks

For each material finding, add a task to the Sprint 0 section of
`{target-dir}/TODO.md` using **lowercase-feature IDs** `S0-<feature>-<seq>`:
- `arch` architecture · `docs` documentation · `sec` security · `bug` correctness ·
  `debt` technical debt · `perf` performance · `infra` infrastructure.
- Draw the sequence from the `<!-- Counters: ... -->` comment; increment and
  rewrite it (or scan for the highest existing `S0-<feature>-N` if absent).
- Order by severity (P0 → P1 → P2).

```
- [ ] **S0-<feature>-<seq>**: {finding} ({P0|P1|P2}, {effort})
      Files: {evidence paths}
      Drift: {spec ref} vs {impl ref}   ← for drift findings
      Added: {today's date}
```

If a finding touches a path in `CRITICAL.md`, note that it auto-escalates.

## Phase 4: Report

Present a synthesis to the user (do NOT write a separate report file — findings live
in TODO.md):

```
Project review — {repo context line if multi-repo}

Health summary:
  Spec-vs-impl drift : {N findings}  {one-line verdict}
  Architecture       : {N findings}  {verdict}
  Documentation      : {N findings}  {verdict}
  Code / security     : {from /code-review, /security-review}
  Verification-ready  : {X of Y CUJs have Driver+Judge}

Added to Sprint 0 ({target-dir}/TODO.md):
  {S0-<id>}  {P?}  {finding}
  ...

Next: /open to prioritize, /implement <id>, or /verify to simulate CUJs
```
