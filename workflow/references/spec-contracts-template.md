# {PROJECT_NAME} — Contracts

The stable interfaces the system exposes or depends on: APIs, schemas, message
formats, CLI surfaces, file formats. Part of `spec/` — forkable, **status-free**,
protected. Changing a contract is a breaking change; propose via
`spec/open-questions.md` or a Sprint 0 task, don't edit silently during `/implement`.

---

## Contract: [name, e.g. "Ingest API"]

**Kind:** [REST endpoint | gRPC | event/message | schema | CLI | file format]
**Consumers:** [who depends on this — internal modules, external clients, forks]
**Stability:** [stable | experimental | deprecated]

**Shape:**
```
[request/response schema, message fields, CLI flags, or file layout]
```

**Invariants:**
- [What callers may rely on — required fields, ordering, idempotency, error codes.]

**Versioning / compatibility:**
- [How breaking changes are introduced; deprecation policy.]

---

## Contract: [name]

...
