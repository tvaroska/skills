# {PROJECT_NAME} — Decisions & Learning Log

**Append-only.** Committed. Newest entries at the top. Agents READ this before
working and APPEND an entry after every task (`/implement`, `/implement-all`).
This is the *committed* home for reasoning that would otherwise die in local,
gitignored `.claude/plans/` files.

**How to use:**
- One entry per meaningful decision or learning. Never edit or delete past
  entries — supersede them with a new dated entry instead.
- Keep it concrete: what changed, why, and what bit us. Future agents rely on
  the Gotchas to avoid repeating mistakes.
- Architectural decisions that need standalone detail also get an ADR in
  `design/decisions/` (see `design-adr-template.md`); link it here.

---

## {DATE} — [Short title of the decision]

**Task:** [task-id, e.g. S1-infra-3] · **Area:** [feature slug]

**Decision:** [What was decided / done, in one or two sentences.]

**Rationale:** [Why this over the alternatives. What constraints drove it.]

**Gotchas:** [Surprises, footguns, non-obvious dependencies, things the next
agent must know. Write "None" only if truly none.]

<!-- Copy the block above for each new entry; keep newest on top. -->

---

## {DATE} — Project initialized (gen-3 workflow)

**Task:** setup · **Area:** infra

**Decision:** Adopted the gen-3 planning workflow (Option-A layout: `spec/` +
`design/` at root, `docs/` for planning/ops, `TODO.md` for live status).

**Rationale:** Single file convention, verification ladder, committed decision log.

**Gotchas:** None yet.
