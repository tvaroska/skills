# {PROJECT_NAME} — TODO & Live Status

**Last Updated:** {DATE}
**Current Focus:** Sprint 0 (Foundation)
**Cadence:** 2-week sprints
{REPO_LINE}

> This file is the ONLY place live status and counts live. Keep status/counts
> OUT of `spec/` and `design/` — those stay status-free.
> See [docs/roadmap.md](docs/roadmap.md) for strategic priorities.
> See [docs/features/](docs/features/) for the completed-work archive.
> See [DECISIONS.md](DECISIONS.md) for the decision/learning log.
> See [CRITICAL.md](CRITICAL.md) for protected/sensitive paths (auto-escalate).

<!-- Counters: sec=0 bug=0 infra=0 perf=0 debt=0 rel=0 -->

**Checkbox states:** `- [ ]` open · `- [x]` done · `- [!]` attempted-but-failed
(awaiting follow-up). `/open` and `/status` surface `- [!]`; `/implement` may
pick one up to retry.

---

## Sprint 0: Critical Issues (always-active triage lane)

No open issues. Add with `/new-task` (categories: sec, bug, infra, perf, debt, rel).

<!-- Example rows:
- [ ] S0-sec-1 (P0) Rotate leaked API key and add secret scanning
- [!] S0-bug-2 (P1) Fix race in upload finalize — retry failed, see DECISIONS.md
-->

---

## Sprint 1: Foundation

Tasks to be added with `/new-feature` or `/new-task`. IDs use the current
sprint number and a lowercase feature slug, e.g. `S1-infra-3`.

<!-- Example rows:
- [ ] S1-infra-1 Scaffold service skeleton + CI
- [x] S1-infra-2 Wire lint/type-check into the test command
-->

---

**Workflow:** /open | /implement | /new-task | /new-feature | /replan | /verify | /status
