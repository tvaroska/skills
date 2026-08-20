# {PROJECT_NAME} — Architecture (as built)

THE HOW. Describes the system as it is actually built. Part of `design/`.
Keep status/counts OUT (F6) — live status lives in `TODO.md`. When the build
diverges from `spec/`, update this doc and raise the gap in `spec/open-questions.md`.

**Stack:** {STACK}

---

## System overview

[High-level description + component diagram (ASCII or link). How the pieces fit.]

## Components

### [Component 1]

**Responsibility:** ...
**Location:** [path in repo]
**Dependencies:** ...
**Implements CUJs:** [CUJ ids from spec/cujs.md this component supports]

### [Component 2]

...

## Data flow

[How data / requests move through the system, end to end.]

## Deployment topology

[Runtime shape — processes, services, zones, external systems.]

## Constraints

- [Hard constraints the design must respect — platform, latency, cost, compliance.]

## Cross-references

- Boundaries & test seams: `design/seams.md`
- Reusable patterns: `design/patterns.md`
- Decision records: `design/decisions/`
