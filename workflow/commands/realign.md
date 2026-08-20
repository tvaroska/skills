---
description: Migrate an existing repo up to the gen-3 workflow (dry-run plan first, then a new branch)
argument-hint: Optional repo name (multi-repo only)
---

# Realign — Brownfield Migration to Gen-3

Bring an **existing** repository up to the gen-3 canonical layout without losing
history. This is the key brownfield command: it reads whatever convention the repo
is on today (`PLAN.md`, `wiki/`, flat `docs/`, or gen-2 `docs/`), **shows a
dry-run migration plan first**, asks about anything genuinely ambiguous, and only
then executes the moves on a **new git branch** so nothing is destroyed.

Greenfield repos should use `/setup` instead — realign only touches repos that
already have planning/doc artifacts.

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: ask scope (all repos / central only / a named repo).
   - If not found → check if a parent has `.repos.json` → **inside subrepo**: realign this repo only.
   - If neither → **single-repo mode**: realign the current directory.
2. If `$ARGUMENTS` contains a repo name (central mode), scope to that repo.

Run the detection + plan steps below **per repo in scope**. In multi-repo mode,
present one combined plan covering every repo before executing anything.

### Guard: workspace of independent nested repos

Before planning any multi-repo or central-mode migration, check whether the
immediate subdirectories are **independent git repos** rather than plain
directories of THIS repo. A subdir is an independent repo if it has its own
`.git` AND is untracked/gitignored by the current repo:

```bash
for d in */; do
  [ -d "$d/.git" ] || git -C "$d" rev-parse --git-dir >/dev/null 2>&1 || continue
  tracked=$(git ls-files --error-unmatch "$d" 2>/dev/null | head -1)
  ignored=$(git check-ignore "$d" 2>/dev/null)
  [ -z "$tracked" ] && echo "INDEPENDENT: $d (own history${ignored:+, gitignored})"
done
```

If any subdir is an independent repo, this is a **workspace**, not a monorepo.
`/realign`'s central/`git mv` model spans ONE repo boundary and CANNOT migrate
independent nested repos (their files aren't tracked here, and each has its own
history + remote to preserve). In that case:

- **STOP before executing.** Do not attempt a central migration across them.
- **Warn the user explicitly** and **recommend running `/realign` inside each
  sub-repo separately**, one boundary at a time (each gets its own dry-run and
  its own `gen3-realign` branch). List the sub-repos found and which carry
  legacy planning artifacts (`PLAN.md`/`TODO.md`/`wiki/`/flat `docs/`), e.g.:

  ```
  ⚠ This looks like a workspace of independent git repos, not a monorepo.
    /realign migrates within a single repo boundary and can't cross these.
    Run it inside each sub-repo instead:

      cd bingo      && /realign      # PLAN.md + TODO.md present (will merge)
      cd content    && /realign      # PLAN.md
      cd downloader && /realign      # PLAN.md
      cd services   && /realign      # PLAN.md
      # kernel-panic: no planning artifacts — use /setup if you want gen-3

    (Sub-repos with both PLAN.md and TODO.md will be flagged for merge review.)
  ```

- You MAY still realign the workspace root's OWN tracked artifacts (its
  `CLAUDE.md`/`docs/`) in single-repo mode, and optionally create a `.repos.json`
  registry pointing at the sub-repos — but the per-sub-repo content migration
  must be run inside each one. Confirm with the user before doing the root only.

## Step 1 — Detect Current State

Inspect the target directory and classify it. Record findings; they drive the plan.

**Task file:**
- `PLAN.md` present, no `TODO.md` → gen-1/orchestrator convention → will become `TODO.md`.
- `TODO.md` present → already gen-3-ish; only check format/ID/checkbox drift.
- Both present → flag for the user; default is to merge `PLAN.md` content into `TODO.md`.

**Docs convention:**
- `wiki/` with many `*.md` (docbride3-style, spec+design mixed) → classify each into `spec/` · `design/` · `docs/`.
- Flat `docs/` with everything jumbled (document-bridge-style: `architecture.md`, `cujs.md`, `specs.md`, `runbook-*.md`, `vision.md`, `tech-debt.md`, …) → split into `spec/` · `design/` · `docs/`.
- Gen-2 `docs/` (already has `roadmap.md`, `cujs.md`, `specs.md`, `architecture.md`, `testing.md`, `features/`) → lighter touch: lift `cujs.md`/`specs.md`/`standards`/`contracts` into `spec/`, `architecture.md`/`seams`/`zones`/`patterns`/ADRs into `design/`, leave `roadmap.md`/`runbooks`/`testing.md`/`features/` in `docs/`.

**Missing gen-3 artifacts:** note whether `DECISIONS.md`, `CRITICAL.md`, and
`.gitignore` coverage of `.claude/plans/` exist.

## Step 2 — Classify Every Doc File

Build the classification using this heuristic (the canonical layout in
`GEN3-CONVENTIONS.md` is the target):

- **`spec/` — THE WHAT (requirements, forkable, status-free, protected):**
  CUJs (`*cujs*`), standards (`*standards*`), contracts (`*contract*`),
  demos/eval descriptions (`*-demo*`, `*demo-suite*`, `evals/`),
  open questions (`*open-questions*`), product specs / requirements / vision.
  → `spec/cujs.md`, `spec/standards.md`, `spec/contracts.md`,
    `spec/demos/*.md`, `spec/open-questions.md`.
- **`design/` — THE HOW (built):** architecture (`*architecture*`, `*layout*`),
  seams (`*seams*`), zones (`*zones*`), patterns (`*patterns*`), and any ADRs
  → `design/architecture.md`, `design/seams.md`, `design/zones.md`,
    `design/patterns.md`, `design/decisions/*.md`.
- **`docs/` — planning/ops (stays):** roadmap (`*roadmap*`),
  runbooks (`*runbook*` → `docs/runbooks/*.md`), testing (`*testing*`),
  tech-debt/features history → `docs/features/*.md`.

For docbride3-style `wiki/bridge-*.md`, strip the `bridge-` prefix when naming the
target (e.g. `wiki/bridge-seams.md` → `design/seams.md`).

**Ambiguous files → ASK.** Some files are genuinely both spec and design, or their
target isn't obvious. The known example is `bridge-patterns.md` (reads as both a
requirements/standard and a design doc). For each ambiguous file, use
**AskUserQuestion**:

> "`{file}` looks like it could be both spec (requirements) and design (how it's
> built). Where should it go?"
> - **spec/** — it's a requirement/standard others fork from
> - **design/** — it's how this repo is built
> - **Split it** — carve requirements into `spec/`, design into `design/`
> - **docs/** — it's really planning/ops

Do **not** guess on ambiguous files; only auto-classify the clear ones.

## Step 3 — Build the Migration Plan (DRY RUN — show, do not execute)

Produce a table of **every** action. Nothing is written yet. Cover:

- **Task file:** `PLAN.md` → `TODO.md` (rename), and any content reshaping.
- **Prose → checklist:** if `PLAN.md`/`TODO.md` has prose plans instead of
  `- [ ]` task lines, convert to checklist tasks with IDs
  `S<sprint>-<feature>-<seq>` using **lowercase** feature slugs.
- **ID normalization:** rewrite uppercase-category IDs (`S0-BUG-1`) to lowercase
  (`S0-bug-1`); reconcile the `<!-- Counters: ... -->` comment to lowercase keys.
- **Checkbox normalization:** ensure all three states are used correctly —
  `- [ ]` open · `- [x]` done · `- [!]` attempted-but-failed. Map any legacy
  markers to these.
- **Doc moves:** one row per file → its `spec/` · `design/` · `docs/` target
  (from Step 2), marking `git mv` vs split.
- **New artifacts:** create `DECISIONS.md` (append-only log) and `CRITICAL.md`
  (protected-paths registry; seed it with `spec/` since spec is protected).
- **Gitignore:** add `.claude/plans/` (and `.claude/` state) to `.gitignore`.
  If plan files are currently git-**tracked**, plan a `git rm --cached` for them.
- **Dead-link scan:** list intra-repo links that will break after moves and the
  rewrite each needs.
- **CLAUDE.md:** update/add the gen-3 workflow section (from
  `${CLAUDE_PLUGIN_ROOT}/references/claude-md-section.md`).

Render it like:

```
Migration plan for {repo} → gen-3 (DRY RUN — nothing changed yet)

Task file
  PLAN.md → TODO.md                                   rename
  3 prose plan paragraphs → 3 `- [ ]` tasks           convert
  S0-BUG-1, S0-SEC-2 → S0-bug-1, S0-sec-2 (+7 more)   normalize IDs

Docs
  wiki/bridge-cujs.md        → spec/cujs.md           git mv
  wiki/bridge-standards.md   → spec/standards.md      git mv
  wiki/bridge-seams.md       → design/seams.md        git mv
  wiki/bridge-patterns.md    → (ASK)                  ambiguous
  docs/roadmap.md            → docs/roadmap.md         stays
  docs/runbook-rfp.md        → docs/runbooks/rfp.md   git mv
  ...

New artifacts
  DECISIONS.md   create   CRITICAL.md   create (seed: spec/)

Gitignore
  .claude/plans/   add     (12 tracked plan files → git rm --cached)

Links to fix after moves
  TODO.md:  docs/architecture.md#... → design/architecture.md#...  (4 refs)
  ...

Target branch: gen3-realign
```

**Stop and let the user confirm** the plan before touching anything.

## Step 4 — Execute on a New Branch (non-destructive)

After confirmation:

1. **Create a branch** so nothing is lost and the migration is reviewable:
   ```
   git switch -c gen3-realign
   ```
   (If it exists, use `gen3-realign-2`, etc. Report the actual name used.)
2. **Move with history preserved** — use `git mv` for every rename/relocation
   (never copy-and-delete). For **splits**, create the new files, `git rm` the old
   only after content is carved out.
3. **Rewrite content** as planned: `PLAN.md`→`TODO.md`, prose→checklist, ID and
   checkbox normalization, counter comment.
4. **Create** `DECISIONS.md` and `CRITICAL.md` (seed `CRITICAL.md` with `spec/`
   and any auth/payments/migrations paths you can identify).
5. **Update `.gitignore`** (`.claude/plans/`) and `git rm --cached` any tracked
   plan files.
6. **Fix links.** After all moves, grep the repo for links to moved files and
   rewrite them (`[text](old)`, `[[wiki-links]]`, and bare-path references).
7. **Update CLAUDE.md** with the gen-3 workflow section.
8. **Do NOT commit automatically** unless the user asks — leave the branch staged
   so they can review the diff first.

Multi-repo: repeat per repo in scope on the same branch.

## Step 5 — Verify

- **No dead links:** re-grep for links pointing at old paths / deleted files;
  report any that remain.
- **No orphaned files:** confirm every source file landed somewhere (moved, split,
  or explicitly left in place).
- **Status-free spec/design:** flag any lingering counts/status text in `spec/` or
  `design/` (live status belongs only in `TODO.md`).

## Report

```
Realign complete → branch: {branch-name}  (not yet committed)

Moved:      {N} files (wiki/ + docs/ → spec/ · design/ · docs/)
Split:      {N} files (ambiguous — per your choices)
Renamed:    PLAN.md → TODO.md
Normalized: {N} task IDs → lowercase, {N} checkboxes, counters comment
Created:    DECISIONS.md, CRITICAL.md
Gitignore:  .claude/plans/ added ({N} tracked plan files untracked)
Links:      {N} references rewritten, 0 dead links remaining
CLAUDE.md:  gen-3 workflow section added

Review the diff, then commit/merge when happy:
  git diff main...{branch-name}

Next: /open to see priorities · /verify to run CUJ checks · /rebuild (advanced) to
regenerate code from spec/ + design/
```
