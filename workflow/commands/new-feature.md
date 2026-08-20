---
description: Define a new feature and add it to the backlog
argument-hint: Optional feature description
---

# New Feature

Define a new feature through a few guided questions, then route it into the gen-3
docs layout: requirements to `spec/`, decisions to `design/`, planned work to
`docs/features/`, and (optionally) tasks to `TODO.md`. Keep it low ceremony — ask
only what's needed.

Initial description: $ARGUMENTS

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: ask which repo to target (see below)
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: target the current repo
   - If neither → **single-repo mode**: target the current directory

2. **Repo selection (central only):**
   - Read `.repos.json` to get the repo list
   - AskUserQuestion: "Which repo should this feature be added to?" with options: "central" + each registered repo name
   - Resolve the target directory: `.` for central, `{repo.path}/` for a subrepo

## Gather Information

Use AskUserQuestion to collect:

1. **Feature Name** — "What is the feature name?" (pre-fill from $ARGUMENTS if provided)

2. **Feature Area** — Dynamically detect areas (this becomes the lowercase task-ID slug):
   - List existing `{target-dir}/docs/features/*.md` files
   - Present the filenames as options (e.g. "scheduling", "browser-rendering", "auth")
   - Add "New area..." as the final option
   - If "New area..." is selected, ask for the area name
   - If no `docs/features/` directory exists, ask for the area name directly
   - Normalize the area to a short lowercase slug (e.g. "User Auth" → `auth`)

3. **Problem Statement** — "What user problem does this feature solve?"

4. **Priority** — "How urgent/important is this feature?"
   - P0 - Critical: Blocks users, revenue impact, or severe UX degradation
   - P1 - High: Major user value, competitive advantage, frequently requested
   - P2 - Medium: Nice to have, quality of life improvement
   - P3 - Low: Future consideration, minimal user impact

## Add to Feature File (planned work)

1. Read `{target-dir}/docs/features/{area-slug}.md`.
   - If the file doesn't exist, create it from `${CLAUDE_PLUGIN_ROOT}/references/feature-template.md`
     if available, otherwise with standard sections (Overview, Completed Work,
     In Progress, Planned Work). Replace `{FEATURE_NAME}` with the area name and
     `{DESCRIPTION}` with "Feature area for {area name}."

2. Add to the "Planned Work" section:
   ```
   ### {Feature Name} (Priority: {Priority})
   - **Problem:** {Problem Statement}
   - **Status:** Planned
   - **Added:** {today's date}
   ```

## Write Requirements to spec/ (THE WHAT)

Requirements live in `spec/` in gen-3 — **not** in `docs/specs.md`. Keep spec
files STATUS-FREE (no counts, no progress). `spec/` is protected: this command may
author it, but `/implement` never edits it.

3. **Requirements & acceptance criteria** → `{target-dir}/spec/standards.md`.
   - Create the file if missing (heading `# {project} — Standards & Requirements`).
   - Add or extend a section for `{area-slug}` with:
     ```
     ### {Feature Name}
     **Requirement:** {what the feature must do, derived from the problem statement}

     **Acceptance Criteria:**
     - [ ] {measurable, exercised outcome — what proves it works}
     ```

4. **Interface/API contracts (if the feature introduces or changes any)** →
   `{target-dir}/spec/contracts.md` — record the contract shape. Skip if none.

5. **CUJs** → read `{target-dir}/spec/cujs.md` (if it exists). AskUserQuestion:
   "Which Critical User Journey does this feature support?" — update that CUJ's
   `Supported By:` field, or note a new CUJ is needed.

6. **Open questions** → if anything material is undecided, append it to
   `{target-dir}/spec/open-questions.md` (create if missing) rather than guessing.

## Record Decisions to design/ (THE HOW)

7. If defining this feature settles a design/architecture decision, capture it:
   - Append a short ADR to `{target-dir}/design/decisions/` named
     `{area-slug}-{short-slug}.md` (decision, context, consequence), and
   - Append a one-line entry to `{target-dir}/DECISIONS.md` (append-only log).
   Skip both if no real decision was made — do not manufacture ceremony.

## Update Roadmap

8. If P0 or P1, update `{target-dir}/docs/roadmap.md` (if it exists) to reflect the
   new priority for `{area-slug}`.

## Sprint Decision

9. AskUserQuestion: "Add to the current sprint in TODO.md, or keep in the backlog?"
   - **Current sprint**: Read `{target-dir}/TODO.md`. For each task, generate an ID
     `S{current-sprint}-{area-slug}-{seq}` using the counter comment
     (`<!-- Counters: ... -->`) — increment `{area-slug}` (add it to the counter if
     absent). Add the task(s) as `- [ ]` under the current sprint section.
   - **Backlog**: Leave it in the feature file / spec only.

## Report

```
Feature added: {Feature Name}
  Planned work: {target-dir}/docs/features/{area-slug}.md
  Requirements: {target-dir}/spec/standards.md
  {if contracts touched: "Contracts: {target-dir}/spec/contracts.md"}
  {if ADR written: "Decision: {target-dir}/design/decisions/{...}.md + DECISIONS.md"}
Priority: {Priority}
{repo context line if multi-repo: "Repo: {repo-name}"}

Next: /implement {task-id} to start working on it
```
