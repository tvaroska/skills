---
description: Turn vague user feedback into a clarified, triaged task or feature via interview
argument-hint: The raw feedback / complaint / request (as free text)
---

# Intake — Feedback → Clarity → Route

Take **vague or incomplete user feedback** and run an interview to establish the
*real* problem, its severity, and whether it is a bug or a feature. The interview
**is** the triage — there is no separate inbox artifact. Once clear, route straight
into `/new-task` (Sprint 0) or `/new-feature` (backlog/spec).

Raw feedback: $ARGUMENTS

## Detect Context

1. **Check for `.repos.json`** in the current directory.
   - If found → **central repo**: ask which repo the feedback concerns (see below).
   - If not found → check if a parent directory has `.repos.json` → **inside subrepo**: target current repo.
   - If neither → **single-repo mode**: target current directory.

2. **Repo selection (central only):**
   - Read `.repos.json` to get the repo list.
   - AskUserQuestion: "Which repo does this feedback concern?" with options: "central" + each registered repo name.
   - Resolve `{target-dir}`: `.` for central, `{repo.path}/` for a subrepo.

## Phase 1: Orient (read, don't ask yet)

Before interviewing, skim what exists in `{target-dir}/` so questions are informed:
- `spec/cujs.md` — which Critical User Journey does this feedback touch?
- `spec/standards.md`, `spec/contracts.md` — is this a spec violation or a new ask?
- `TODO.md` Sprint 0 — is there already an open/`- [!]` task for this?
- `CRITICAL.md` — does the feedback point at a protected/sensitive area?

If the feedback clearly duplicates an existing open task, say so and stop (offer to
bump its severity instead of creating a duplicate).

## Phase 2: Interview (AskUserQuestion)

Ask only what you still need — pre-fill answers you can infer from Phase 1. Cover:

1. **Real problem** — "What is the user actually unable to do, or what outcome is
   wrong?" Distinguish the symptom they reported from the underlying problem.
   Offer options derived from Phase 1 (e.g. affected CUJ / area) plus "Other".

2. **Reproduction / evidence** — "When does this happen? Steps, environment, or an
   example?" (Skip for pure feature requests.)

3. **Bug vs. feature** — "Is this something that is *broken versus spec* (bug), or
   something *new / not yet specified* (feature)?"
   - Broken vs. expected/spec behaviour → **bug**.
   - New capability or changed requirement → **feature**.
   - If genuinely ambiguous, ask which of the two the user wants to treat it as.

4. **Severity / impact** — "How much does this hurt right now?"
   - P0 - Critical: broken core journey, security, data loss, revenue impact.
   - P1 - High: major user impact, blocks a key workflow, no clean workaround.
   - P2 - Medium: moderate impact, workaround exists.
   - P3 - Low: minor / cosmetic / future consideration.

5. **Category** (bugs only) — security → `sec`, production bug → `bug`,
   infrastructure → `infra`, performance → `perf`, technical debt → `debt`,
   frontend → `fe`, UX → `ux`. Use a lowercase feature slug.

## Phase 3: Route

Decide from the interview — do NOT create a separate inbox file.

- **Bug, OR any P0/P1 that must be fixed now → `/new-task` flow (Sprint 0).**
  Hand off the clarified problem, chosen category slug, severity, and effort.
  The task ID is `S0-<category>-<seq>` (lowercase feature slug; sequence from the
  `<!-- Counters: ... -->` comment in `{target-dir}/TODO.md`). Preserve the
  reproduction/evidence in the task body.
  - If the affected area is listed in `CRITICAL.md`, note in the task that it
    **auto-escalates** (stronger model + mandatory review before commit).

- **Feature (new/changed requirement, typically P2/P3) → `/new-feature` flow.**
  Hand off the feature name, problem statement, priority, and target area so it
  lands in `spec/` + `docs/features/` (backlog), not Sprint 0.

When routing, invoke the sibling command's logic with the clarified inputs so the
user is not re-interviewed for the same facts.

## Report

```
Intake complete — {repo context line if multi-repo}

Raw feedback: {one-line summary of $ARGUMENTS}
Real problem: {clarified problem}
Classification: {Bug | Feature} · Severity: {P0..P3}
Routed to: {/new-task → S0-<cat>-<seq>  |  /new-feature → spec/ + docs/features/<area>.md}
{CRITICAL escalation note, if applicable}

Next: {/implement S0-<cat>-<seq>  |  /open  |  review the drafted feature}
```
