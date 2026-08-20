---
description: End-user test of the production app via dev-browser → Sprint 0 bug/FE/UX tasks
argument-hint: Target URL (default https://update.tvaroska.sk)
---

# User Test — End-User Review

Review the production application as an end user, testing for bugs, visual quality,
and feature usefulness. Findings land as Sprint 0 tasks in `TODO.md`.

Target URL: $ARGUMENTS (default: https://update.tvaroska.sk)

## Prerequisites

- The **dev-browser** skill must be available (Chrome extension mode with relay
  already connected).
- Use the **Skill** tool to invoke `dev-browser` for browser automation.

## Detect Context

Resolve which repo's `TODO.md` receives the findings:
- Check for `.repos.json` in the current directory → **central**: AskUserQuestion
  which repo the app maps to.
- Parent has `.repos.json` → **inside subrepo**: use current repo.
- Neither → **single-repo mode**: use current directory.

Set `{target-dir}` accordingly.

## Review Process

Perform a systematic ~15-minute user test of the production application. Use the
dev-browser skill to automate Chrome via the extension relay (already connected).
Create named pages for each area tested.

### Phase 1: Initial Load & Navigation (3 min)

1. Navigate to the target URL, take a viewport screenshot.
2. Extract all navigation links from the header/nav.
3. Record initial observations: load time feel, visual first impression, layout structure.
4. Check mobile responsiveness by setting viewport to 375x812 and taking a screenshot.

### Phase 2: Page-by-Page Review (8 min)

Visit each page linked in the navigation. For each page:

1. Take a viewport screenshot.
2. Extract page content (headings, interactive elements, buttons, forms).
3. Test primary interactions:
   - Click buttons and links, verify expected behavior.
   - Fill and submit forms, check validation.
   - Toggle switches/filters, verify state changes.
   - Open modals/panels, verify they close properly.
4. Note: close browser pages between tests to avoid screenshot timeout issues with the extension.

Check specifically for:
- **Broken features**: buttons that error, searches that fail, filters that don't work.
- **Navigation bugs**: links going to wrong pages, missing routes (404s), overlays blocking interaction.
- **Visual issues**: overflow, alignment, responsive breakpoints, empty states.
- **Data issues**: excessive items (hundreds of tags, unpaginated lists), missing metadata.

### Phase 3: Interactive Feature Testing (4 min)

Test key workflows end-to-end:
- Search: enter a query, check results, test any advanced modes (semantic, filters).
- Content creation: test add/create flows, check form validation.
- Detail views: open items, check panel/modal behavior, verify deep-linking (URL changes).
- Tag/filter interactions: click tags/categories, verify filtering works.
- User menu: open profile/settings dropdown, verify it opens and closes cleanly.

## Reporting

After testing, compile findings into these categories:

### Bugs (Functional Issues)
For each bug, document:
- **Priority**: P1 (broken core feature), P2 (broken secondary feature), P3 (minor).
- **Steps to reproduce**.
- **Expected vs actual behavior**.
- **Affected files** (estimate from component/route names).

### UX Issues
For each UX issue, document:
- **Priority**: P2-P4.
- **What's wrong** and **how to fix it**.

### Visual Quality
- What looks good (positive feedback).
- What needs improvement.

### Feature Usefulness
- Which features provide clear value.
- Which features feel incomplete or unclear.

## Task Creation

After compiling findings, read `{target-dir}/TODO.md`. Add all findings as new
Sprint 0 tasks using **lowercase-feature IDs** `S0-<feature>-<seq>`:

- Bugs → `S0-bug-<seq>`
- Frontend fixes → `S0-fe-<seq>`
- UX improvements → `S0-ux-<seq>`

Draw each sequence from the `<!-- Counters: ... -->` comment in TODO.md (increment
and rewrite it), or scan for the highest existing `S0-<feature>-N` if absent.

Each task follows the format:
```markdown
- [ ] **S0-<feature>-<seq>**: {Short description} ({Priority}, {Effort estimate})
      Files: {Affected files}
      Added: {today's date}
      {Detailed description with steps to reproduce for bugs}
```

If a finding touches a path listed in `CRITICAL.md`, note that it auto-escalates.

Order Sprint 0 by priority (P0/P1 first). Update TODO.md's "Last Updated" date to
reflect the new Sprint 0 tasks (live status lives only in TODO.md).

Present a final summary table to the user with all findings grouped by priority.
