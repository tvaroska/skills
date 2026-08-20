# {PROJECT_NAME} — Standards

Cross-cutting rules the system must uphold. Part of `spec/` — forkable,
**status-free**, protected. This is THE WHAT (quality bars), not THE HOW.
Agents propose changes here; they do not edit it during `/implement`.

**Stack:** {STACK}
**Test command:** `{TEST_COMMAND}` (must include lint/type-check, not just unit tests)

---

## Coding standards

- [Language/style conventions, formatter, linter config that MUST pass in T1.]
- [Naming, module boundaries, error-handling policy.]

## Quality bars

- **Verification:** every task passes the ladder — T1 (test + build + lint/type-check),
  T2 (acceptance criteria exercised), T3 (CUJ sim at sprint close).
- [Coverage / performance / accessibility thresholds, if any.]

## Security & data

- [Secrets handling, PII policy, authn/authz expectations.]
- [Paths that must be listed in `CRITICAL.md`.]

## Observability

- [Logging/tracing requirements — e.g. OTLP traces for agent runs, structured logs.]

## Dependencies & licensing

- [Allowed licenses, dependency review policy, pinning.]
