# {PROJECT_NAME} — Seams & Boundaries

THE HOW, at the joints. Documents the seams where the system can be tested,
faked, or extended — the boundaries between zones, and the injection points the
verification ladder relies on. Part of `design/`. Status-free.

A **seam** is a place where you can alter behavior without editing the code on
either side — the basis for fakes, e2e harnesses (T3 Drivers), and safe extension.

---

## Zones / trust boundaries

[The major zones and what crosses each boundary — e.g. untrusted-inbound vs
internal, network segments, tenant isolation. What is authoritative vs advisory.]

| Boundary | Inside | Outside | What crosses |
|----------|--------|---------|--------------|
| ... | ... | ... | ... |

## Test seams

For each seam the T3 CUJ Drivers depend on:

### [Seam name, e.g. "external party responses"]

**Where:** [interface / module boundary]
**Real implementation:** [what runs in prod]
**Fake / harness:** [what the e2e harness or agent-sim substitutes — e.g.
`E2EHarness` with fakes over shared stores]
**Used by CUJs:** [CUJ ids]

## Extension points

[Where new verticals/skills/adapters plug in without a redeploy or core change.]
