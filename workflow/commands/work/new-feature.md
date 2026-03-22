---
description: Define a new feature and add it to the backlog
argument-hint: Optional feature description
---

# New Feature

Define a new feature through guided questions and add it to the appropriate docs.

Initial description: $ARGUMENTS

## Gather Information

Use AskUserQuestion to collect:

1. **Feature Name** — "What is the feature name?" (pre-fill from $ARGUMENTS if provided)

2. **Feature Area** — Dynamically detect areas:
   - List existing `docs/features/*.md` files in the current project
   - Present filenames as options (e.g., "scheduling", "browser-rendering", "production-readiness")
   - Add "New area..." as the final option
   - If "New area..." selected, ask for the area name
   - If no `docs/features/` directory exists, ask for the area name directly

3. **Problem Statement** — "What user problem does this feature solve?"

4. **Priority** — "How urgent/important is this feature?"
   - P0 - Critical: Blocks users, revenue impact, or severe UX degradation
   - P1 - High: Major user value, competitive advantage, frequently requested
   - P2 - Medium: Nice to have, quality of life improvement
   - P3 - Low: Future consideration, minimal user impact

## Add to Feature File

1. Read `docs/features/{feature-area-slug}.md`
   - If file doesn't exist, create it with the feature file template (read `../references/feature-template.md` if available, otherwise use standard sections: Overview, Completed Work, In Progress, Planned Work)

2. Add to "Planned Work" section:
   ```
   ### {Feature Name} (Priority: {Priority})
   - **Problem:** {Problem Statement}
   - **Priority:** {Priority}
   - **Status:** Planned
   - **Added:** {today's date}
   ```

## Update Related Docs

3. Read `docs/specs.md` (if exists) — add feature requirements under the relevant area section
4. Read `docs/cujs.md` (if exists) — ask which CUJ this feature supports, update if needed
5. If P0 or P1, update `docs/roadmap.md` (if exists) to reflect the new priority

## Sprint Decision

6. AskUserQuestion: "Add to current sprint in TODO.md, or keep in backlog?"
   - **Current sprint**: Read TODO.md, add tasks to current sprint section with generated task IDs
   - **Backlog**: Leave in feature file only

## Report

```
Feature added: {Feature Name}
Location: docs/features/{area}.md
Priority: {Priority}

Next: /implement {task-id} to start working on it
```
