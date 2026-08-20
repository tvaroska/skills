# {PROJECT_NAME} — Critical / Protected Paths Registry

**Committed.** Registry of sensitive or protected files and areas. Any task that
touches a path listed here **auto-escalates**: `/implement` and `/implement-all`
select a stronger model and require a mandatory review + full verification ladder
before commit. Agents consult this file during planning.

**Two kinds of entry:**
- **protected** — agents must NOT edit during `/implement`; they PROPOSE changes
  (e.g. open a question in `spec/open-questions.md` or a Sprint 0 task) and wait
  for human sign-off. `spec/` is protected by default: it is the forkable,
  status-free source of truth for *what* the system must do.
- **sensitive** — agents MAY edit, but the change auto-escalates (stronger model,
  mandatory review, full ladder) because a mistake here is high-blast-radius
  (auth, payments, migrations, secrets, infra).

**Matching:** a task auto-escalates if any file it changes matches a Path below
(prefix match on directories, glob on patterns).

---

| Path | Kind | Why it's critical |
|------|------|-------------------|
| `spec/` | protected | Source-of-truth requirements/CUJs/contracts. Forkable and status-free; changing it silently redefines "done." Agents propose, never edit during `/implement`. |
| `CRITICAL.md` | protected | This registry itself — weakening protection must be a deliberate, reviewed act. |
<!-- Seed additional rows as the project grows, e.g.:
| `src/auth/**` | sensitive | Authentication / session handling; a regression exposes every user. |
| `migrations/**` | sensitive | Schema migrations are irreversible in prod; require review + backup plan. |
| `**/payments/**` | sensitive | Billing/money movement; errors have direct financial + legal cost. |
| `infra/`, `deploy/` | sensitive | Provisioning/deploy config; a bad change can take prod down. |
| `.env*`, `secrets/**` | protected | Credentials; never edit or echo in traces. |
-->

---

## Auto-escalation, in detail

When a planned change intersects any Path above:
1. **Model:** the orchestrator upgrades to the stronger model for planning + implementation.
2. **Review gate:** a mandatory review pass runs before commit (no auto-commit).
3. **Verification:** the full ladder is required — T1 (test + build + lint/type-check),
   T2 (acceptance criteria exercised), and, for `spec/`-adjacent work, the
   relevant T3 CUJ simulation via `/verify`.
4. **Protected paths:** the agent does not modify them. It records the proposed
   change (Sprint 0 task or `spec/open-questions.md`) and stops for human sign-off.
