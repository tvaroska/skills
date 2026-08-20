# Runbook: [Operation name]

Operational procedure for {PROJECT_NAME}. Lives in `docs/runbooks/`. One runbook
per operation (deploy, rollback, incident response, data backfill, key rotation).
Keep it executable and current — this is what an on-call agent or human follows
under pressure.

**Owner:** [team/person] · **Last verified:** {DATE}
**Touches CRITICAL paths?** [yes/no — if yes, changes auto-escalate; see CRITICAL.md]

---

## When to use

[Trigger conditions — the symptom or scheduled event that starts this procedure.]

## Prerequisites

- [Access, credentials, tools, feature flags needed.]

## Procedure

1. [Step — exact command or action]
   ```bash
   [command]
   ```
2. [Step — expected output / how to know it worked]
3. ...

## Verification

- [How to confirm the operation succeeded — checks, dashboards, `/verify` CUJ.]

## Rollback

1. [How to undo, if it goes wrong.]

## Escalation

- [Who/what to page if this fails; links to related runbooks.]
