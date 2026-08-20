export const meta = {
  name: 'implement-all',
  description:
    'Walk TODO.md, implement unblocked tasks one at a time (select → plan → code → T1 gate → T2 acceptance → mark done in TODO.md → commit → archive), continue to the next until the filtered scope is drained, then reconcile claimed-done against the real TODO.md marks + git commits',
  whenToUse:
    'Chew through TODO.md tasks autonomously with a real verification ladder. Optional args narrow the scope: a string like "Sprint 1 only", "Stage 2", or a task-id prefix like "S1-sla"; or an object {scope?: string, maxTasks?: number, stopOnFailure?: boolean, maxAttempts?: number}. No args = every unblocked task in the plan. Three agents per task: a cheap Select (Haiku), a strong Plan (Opus) that also picks the Implement model, and an Implement agent on the model the plan chose. Implement does NOT report success on files-exist/build-green alone — it must clear T1 (project test + build + lint/type-check) to earn the commit and T2 (execute the task ACCEPTANCE CRITERIA — prove the artifact works) to earn the `- [x]` flip. Tasks touching a path listed in CRITICAL.md auto-escalate: a stronger model and a mandatory review pass before commit. Strictly sequential (tasks share files + TODO.md + git history); TODO.md is re-read between tasks so freshly-unblocked dependents get picked up. A failing task is retried (re-plan → re-implement) up to maxAttempts (default 2) then flagged `- [!]` in TODO.md and skipped. After the drain, the run reconciles its in-memory done set against the ACTUAL `- [x]` marks in TODO.md and git commits and reports any mismatch. Reports the git branch at launch and in the final return.',
  phases: [
    { title: 'Preflight', detail: 'report git branch, load CRITICAL.md path registry, confirm TODO.md', model: 'haiku' },
    { title: 'Select', detail: 'read TODO.md, pick the next unblocked in-scope task', model: 'haiku' },
    { title: 'Plan', detail: 'study the task, write the plan file, choose the implement model, flag CRITICAL', model: 'opus' },
    { title: 'Implement', detail: 'code → T1 (test+build+lint) gates commit → T2 (acceptance) gates `- [x]` → commit (model chosen by Plan)' },
    { title: 'Review', detail: 'mandatory pre-commit review for CRITICAL.md tasks, then commit', model: 'opus' },
    { title: 'Archive', detail: 'capture plan substance into docs/features + append DECISIONS.md', model: 'sonnet' },
    { title: 'Flag', detail: 'mark a failed task `- [!]` in TODO.md for later follow-up', model: 'haiku' },
    { title: 'Reconcile', detail: 'reconcile claimed-done against actual TODO.md marks + git commits', model: 'haiku' },
  ],
}

// ---- args -----------------------------------------------------------------
// Accept either a bare string ("Sprint 1 only") or an options object.
const opts = args == null ? {} : typeof args === 'string' ? { scope: args } : args
const scope = (opts.scope || '').toString().trim()
const stopOnFailure = opts.stopOnFailure === true // default: continue past a failed task (flag it, keep draining)
// Hard cap so a mis-read plan can't spin to the 1000-agent backstop. Budget
// (if the user set a "+Nk" target) is the real governor; this is a floor.
const MAX_TASKS = Math.max(1, Math.min(opts.maxTasks || 40, 200))

// Per-task attempt cap. A failed task is retried (re-selected → re-planned →
// re-implemented) until it reaches this many TOTAL attempts, then it is flagged
// `- [!]` and skipped. Absorbs transient agent/API failures without retrying a
// genuinely-broken task forever. Default 2 (one retry). Retries consume MAX_TASKS
// iterations and token budget like any other task.
const MAX_ATTEMPTS = Math.max(1, Math.min(opts.maxAttempts || 2, 5))

// Models the Plan agent is allowed to pick for the Implement phase. Anything
// off this list (or missing) clamps to opus — never silently run implementation
// on an unintended tier.
const ALLOWED_MODELS = ['haiku', 'sonnet', 'opus']
const ALLOWED_EFFORT = ['low', 'medium', 'high']

const scopeLine = scope
  ? `SCOPE FILTER (only tasks matching this count as in-scope): "${scope}".
Interpret it loosely against the plan's own vocabulary — e.g. "Sprint 1"/"Stage 1"/"S1" all mean the Stage 1 section; "S1-sla" means task ids beginning S1-sla; a bare stage/sprint word means that whole section. If a task is ambiguous, treat it as OUT of scope.`
  : `No scope filter — every task in the plan is in-scope.`

// ---- shared paths ---------------------------------------------------------
const TODO_PATH = 'TODO.md'
const CRITICAL_PATH = 'CRITICAL.md'
const DECISIONS_PATH = 'DECISIONS.md'

// ---- schemas --------------------------------------------------------------
const PREFLIGHT_SCHEMA = {
  type: 'object',
  required: ['branch', 'todoExists'],
  properties: {
    branch: { type: 'string', description: 'Current git branch (git rev-parse --abbrev-ref HEAD)' },
    todoExists: { type: 'boolean', description: 'Whether TODO.md exists at the repo root' },
    hasCriticalMd: { type: 'boolean', description: 'Whether CRITICAL.md exists at the repo root' },
    criticalPaths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Path globs/areas listed in CRITICAL.md as protected/sensitive (empty if none)',
    },
  },
}

const SELECT_SCHEMA = {
  type: 'object',
  required: ['task', 'inScopeRemaining', 'reason'],
  properties: {
    task: {
      type: ['object', 'null'],
      description: 'The single next task to implement, or null if none is available',
      properties: {
        id: { type: 'string', description: 'Task id, e.g. S1-sla-1' },
        stage: { type: 'string', description: 'Stage/section heading the task lives under' },
        description: { type: 'string', description: 'The task summary line from TODO.md' },
        dependsOn: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task ids this one depends on that are already complete (why it is unblocked)',
        },
      },
    },
    inScopeRemaining: {
      type: 'integer',
      description: 'Count of open, in-scope tasks remaining INCLUDING the one returned',
    },
    blockedInScope: {
      type: 'array',
      items: { type: 'string' },
      description: 'In-scope open tasks that are blocked, as "id — needs X, Y"',
    },
    reason: { type: 'string', description: 'Why this task was chosen, or why none is available' },
  },
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['planFile', 'recommendedModel', 'complexity', 'rationale', 'acceptanceCriteria', 'touchesCritical'],
  properties: {
    planFile: { type: 'string', description: 'Path to the .claude/plans/{task-id}-{slug}.md you wrote' },
    complexity: {
      type: 'string',
      enum: ['trivial', 'moderate', 'hard'],
      description: 'Honest difficulty of the coding work',
    },
    recommendedModel: {
      type: 'string',
      enum: ALLOWED_MODELS,
      description:
        'Model the Implement agent should run on. haiku only for trivial mechanical edits; sonnet for moderate; opus for hard/novel seam or multi-file work. When unsure, pick up.',
    },
    recommendedEffort: {
      type: 'string',
      enum: ALLOWED_EFFORT,
      description: 'Reasoning effort for the Implement agent',
    },
    acceptanceCriteria: {
      type: 'string',
      description:
        'The concrete, EXECUTABLE acceptance criteria for T2 — how to exercise the finished artifact and prove it actually works (commands to run, expected output/behavior). NOT "files exist" / "build passes".',
    },
    touchesCritical: {
      type: 'boolean',
      description: 'True if this task will create/modify any path listed in CRITICAL.md (or the protected spec/ tree)',
    },
    criticalPathsTouched: {
      type: 'array',
      items: { type: 'string' },
      description: 'The specific CRITICAL.md-listed paths this task touches (empty if none)',
    },
    rationale: { type: 'string', description: 'Why this model/effort fits this task' },
  },
}

const IMPLEMENT_SCHEMA = {
  type: 'object',
  required: ['taskId', 'success', 't1Pass', 't2Pass', 'summary'],
  properties: {
    taskId: { type: 'string' },
    success: {
      type: 'boolean',
      description:
        'True ONLY if T1 passed AND T2 passed AND (for non-critical tasks) TODO.md marked `- [x]` and committed. For CRITICAL tasks leave commit to Review and report success=false-until-reviewed via readyForReview.',
    },
    t1Pass: {
      type: 'boolean',
      description: 'T1 gate: project test + build + lint/type-check (e.g. ruff/vet/tsc) ALL green. Gates the commit.',
    },
    t2Pass: {
      type: 'boolean',
      description: 'T2 gate: the task ACCEPTANCE CRITERIA were executed and the artifact demonstrably works. Gates `- [x]`.',
    },
    acceptanceEvidence: {
      type: 'string',
      description: 'What you ran for T2 and the observed result that proves the task works (not "files exist").',
    },
    readyForReview: {
      type: 'boolean',
      description: 'CRITICAL tasks only: true if code + T1 + T2 are done and staged, awaiting the mandatory Review to commit.',
    },
    committed: { type: 'boolean' },
    commitSubject: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string', description: 'One-paragraph account of what was built' },
    blocker: { type: 'string', description: 'If not success: what stopped it (failing test/lint, unmet acceptance, missing dep, ambiguity)' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['approved', 'committed', 'summary'],
  properties: {
    approved: { type: 'boolean', description: 'True if the change is safe/correct for the CRITICAL area and T1+T2 hold' },
    committed: { type: 'boolean', description: 'True if the reviewer flipped `- [x]` and committed after approving' },
    commitSubject: { type: 'string' },
    issues: { type: 'array', items: { type: 'string' }, description: 'Blocking problems found (empty if approved clean)' },
    summary: { type: 'string' },
  },
}

const ARCHIVE_SCHEMA = {
  type: 'object',
  required: ['archived'],
  properties: {
    archived: { type: 'boolean', description: 'True if plan substance was captured to docs/features and DECISIONS.md appended + committed' },
    featureFile: { type: 'string', description: 'Path to the docs/features/*.md the substance landed in' },
    decisionsUpdated: { type: 'boolean' },
    notes: { type: 'string' },
  },
}

const RECONCILE_SCHEMA = {
  type: 'object',
  required: ['consistent'],
  properties: {
    consistent: { type: 'boolean', description: 'True if every claimed-done task is `- [x]` in TODO.md AND has a git commit, with no surprises' },
    checkedInTodo: { type: 'array', items: { type: 'string' }, description: 'Task ids actually marked `- [x]` in TODO.md now' },
    committedTasks: { type: 'array', items: { type: 'string' }, description: 'Task ids that appear in recent git commit subjects' },
    mismatches: {
      type: 'array',
      items: { type: 'string' },
      description: 'Discrepancies, e.g. "S1-x claimed done but still `- [ ]`", "S1-y committed but not checked off", "S1-z checked but no commit".',
    },
    openRemaining: { type: 'integer', description: 'Count of `- [ ]` open tasks still in TODO.md' },
  },
}

// ---- shared prompt fragments ----------------------------------------------
const CONVENTIONS = `
Project conventions (from CLAUDE.md / gen-3 workflow) you MUST follow:
- Read DECISIONS.md (repo root) FIRST if it exists — prior decisions/gotchas are binding context.
- Python package manager is uv. Task ID format is S<sprint>-<feature>-<seq>. Plan files live at .claude/plans/{task-id}-{slug}.md (enforce that exact naming).
- Match the style, naming, and seam/adapter idioms of the surrounding code. Where a boundary is a seam with a local + a GCP adapter, honor that pattern.
- spec/ is PROTECTED: never edit spec/ during implementation — if a spec change is needed, PROPOSE it in your summary, do not write it.`

const VERIFICATION_LADDER = `
VERIFICATION LADDER — this REPLACES "tests pass". "Files exist" or "build green" is NOT success.
- T1 (gates the COMMIT): run the project's full test suite AND build AND lint/type-check.
  Use the repo's real tools — e.g. \`uv run pytest\` AND \`ruff check\` for Python; \`go build ./...\` AND \`go vet ./...\` AND \`go test ./...\` for Go; \`tsc --noEmit\` / \`eslint\` / \`npm test\` for TS. Lint/type-check is MANDATORY, not optional. All must be GREEN before you commit.
- T2 (gates flipping \`- [x]\`): EXECUTE the task's ACCEPTANCE CRITERIA — actually run the artifact and observe it doing the thing the task asked for. Report the exact command(s) and the observed result as acceptanceEvidence. Do NOT flip \`- [x]\` on the basis that files were created or the build compiled.
Report t1Pass and t2Pass honestly and separately. success=true ONLY when BOTH are true.`

// ---- Flag a failed task in TODO.md ----------------------------------------
// The orchestrator has no file tools, so a cheap agent mutates TODO.md. Flips
// the task's `- [ ]` to `- [!]` and appends a blocker annotation so the failure
// is durable (skipped on re-selection here and on future runs) and visible for
// a human to sort/follow up. Best-effort: if it can't run, the in-memory
// `attempted` list still prevents same-run re-selection.
async function flagFailedInTodo(taskId, blocker) {
  const note = (blocker || 'unknown blocker').toString().replace(/`/g, "'").replace(/\s+/g, ' ').slice(0, 200)
  await agent(
    `In ${TODO_PATH} (repo root), find the single task line for ${taskId} — a \`- [ ]\` markdown checklist item.
Do EXACTLY this to that one line, and nothing else in the file:
1. Change its checkbox from \`- [ ]\` to \`- [!]\` to flag it as ATTEMPTED-BUT-FAILED.
2. Append to the end of the SAME line, matching the file's existing italic-annotation style: \`_(⚠ failed <DATE>; blocker: ${note})_\` — replace <DATE> with today's actual date in YYYY-MM-DD form.
Do NOT edit, reorder, or reformat any other task line. Do NOT flip it to \`- [x]\`.
Then commit only ${TODO_PATH} (path-scoped: \`git commit ${TODO_PATH} -m "${taskId}: flag failed for follow-up"\`) so unrelated working-tree changes are not swept in. Do not push. Report what you changed.`,
    { label: `flag-failed:${taskId}`, phase: 'Flag', agentType: 'general-purpose', model: 'haiku', effort: 'low' },
  )
}

// ---- Preflight: branch + CRITICAL registry --------------------------------
const pre = await agent(
  `Report launch state for an autonomous implementation run, read-only except for nothing (do NOT modify any file):
1. Current git branch: run \`git rev-parse --abbrev-ref HEAD\`.
2. Whether ${TODO_PATH} exists at the repo root.
3. Whether ${CRITICAL_PATH} exists at the repo root; if so, extract the list of protected/sensitive path globs/areas it registers (auth, payments, migrations, spec/, etc.).
Return the branch, todoExists, hasCriticalMd, and criticalPaths.`,
  { label: 'preflight', phase: 'Preflight', agentType: 'general-purpose', model: 'haiku', effort: 'low', schema: PREFLIGHT_SCHEMA },
)

const branch = (pre && pre.branch) || '(unknown)'
const criticalPaths = (pre && pre.criticalPaths) || []
log(`Branch: ${branch}. TODO.md ${pre && pre.todoExists ? 'found' : 'NOT FOUND'}. CRITICAL.md ${pre && pre.hasCriticalMd ? `registers ${criticalPaths.length} path(s)` : 'absent'}.`)
if (pre && pre.todoExists === false) {
  log(`No ${TODO_PATH} at repo root — nothing to drain.`)
  return { branch, scope: scope || '(all tasks)', implemented: [], failed: [], stats: { implemented: 0, failed: 0, iterations: 0 }, error: 'TODO.md not found' }
}
const criticalLine = criticalPaths.length
  ? `CRITICAL.md registers these protected/sensitive paths — a task touching ANY of them auto-escalates scrutiny: ${criticalPaths.join(', ')}.`
  : `CRITICAL.md registers no paths (or is absent). Still treat spec/ as protected.`

// ---- Phase: sequential drain ----------------------------------------------
const done = []
const failed = []
const attempts = {} // taskId -> total attempts so far this run (across phases)
let iter = 0

while (iter < MAX_TASKS) {
  iter += 1

  if (budget.total && budget.remaining() < 120000) {
    log(`Stopping: token budget nearly exhausted (${Math.round(budget.remaining() / 1000)}k left).`)
    break
  }

  try {
  // --- Phase Select: cheap parse of TODO.md, pick the next task ---
  // Belt-and-suspenders exclusion: TODO.md already carries `- [x]` (done) and
  // `- [!]` (failed) markers, but a Flag agent can return null, so also feed
  // this run's attempted ids so a same-run re-pick can't happen either way.
  const attempted = [...done.map(t => t.taskId), ...failed.map(t => t.taskId)]
  const pick = await agent(
    `Read ${TODO_PATH} in the repo root. It is a sprint plan where tasks are markdown checklist items:
\`- [ ]\` is OPEN, \`- [x]\` is DONE, \`- [!]\` is FAILED (attempted earlier but blocked — awaiting human follow-up). Each task has an id like S1-sla-1 and a description; some descriptions state dependencies ("inherits from S1-deploy-1", "reuses S1-flow-1 machinery") or a task sits under a section whose earlier tasks it clearly builds on.

${scopeLine}

Choose the SINGLE next task to implement now, honoring these rules:
- It must be OPEN (\`- [ ]\`) and in-scope. NEVER pick a \`- [x]\` (done) or \`- [!]\` (failed) task.
- It must be UNBLOCKED: every task it depends on is already DONE (\`- [x]\`). A dependency that is \`- [!]\` (failed) does NOT count as satisfied — treat its dependents as blocked.
- Prefer the lowest-numbered / earliest available task so prerequisites land first.
- These tasks were already attempted in this run (done or failed), do NOT pick them again: ${attempted.length ? attempted.join(', ') : '(none yet)'}.

Return the chosen task (or null if nothing is open+in-scope+unblocked), the count of in-scope open tasks remaining, and any in-scope tasks that are blocked (with what they wait on — include those blocked because a prerequisite FAILED). Read-only: do not modify any file.`,
    { label: `select#${iter}`, phase: 'Select', agentType: 'general-purpose', model: 'haiku', effort: 'low', schema: SELECT_SCHEMA },
  )

  if (!pick || !pick.task || !pick.task.id) {
    log(`No implementable task left${scope ? ` in scope "${scope}"` : ''}. ${pick ? pick.reason : ''}`)
    if (pick && pick.blockedInScope && pick.blockedInScope.length) {
      log(`Still blocked: ${pick.blockedInScope.join(' | ')}`)
    }
    break
  }

  const t = pick.task
  log(`[${iter}] Selected ${t.id} — ${t.description || ''} (${pick.inScopeRemaining} in-scope remaining)`)

  // --- Phase Plan: strong model studies the task, writes the plan file, states
  // the executable acceptance criteria (T2), flags CRITICAL touch, and picks the
  // implement model/effort. The plan file is the durable hand-off. ---
  const plan = await agent(
    `Plan the implementation of task ${t.id} from ${TODO_PATH}. Do NOT write implementation code in this step — produce the plan and pick the right model for the coding step.

Task: ${t.id}${t.stage ? ` (under: ${t.stage})` : ''}
${t.description ? `Summary from plan: ${t.description}` : ''}

${criticalLine}

Do this:
1. Read the full task line in ${TODO_PATH} plus any dependency/acceptance notes; read DECISIONS.md and the docs it points at when relevant (spec/, design/architecture.md, design/seams.md, docs/testing.md) and the neighboring code the task extends. Understand the existing seam/adapter patterns.
2. Write an implementation plan to .claude/plans/${t.id}-<slug>.md (short kebab slug; the filename MUST start with the exact task id ${t.id}-). It must be concrete enough for another engineer to execute WITHOUT re-deriving your analysis: ordered steps, exact files to create/modify, the seams touched, the tests + lint/type-check to run (T1), and the EXECUTABLE ACCEPTANCE CRITERIA (T2) — the exact commands to run and behavior to observe that prove the finished artifact actually works (not "files exist"). This file is the ONLY thing the implementer inherits from you — capture every non-obvious decision and gotcha.
3. Decide whether the task touches any CRITICAL.md-listed path (or spec/): set touchesCritical and list criticalPathsTouched. If it does, note the extra care the implementer must take.
4. Judge the coding difficulty and recommend the model + effort for the implement step:
   - haiku → trivial, mechanical (a rename, a constant, a one-file tweak with an obvious test).
   - sonnet → moderate (a self-contained unit, clear pattern to follow, a few files).
   - opus → hard/novel (new seam with local+GCP adapters, cross-cutting flow changes, subtle async/crash-safety, anything you are unsure about). When in doubt, pick up, not down.

${CONVENTIONS}`,
    { label: `plan:${t.id}`, phase: 'Plan', agentType: 'general-purpose', model: 'opus', effort: 'high', schema: PLAN_SCHEMA },
  )

  if (!plan || !plan.planFile) {
    const blocker = 'planning step produced no plan file'
    attempts[t.id] = (attempts[t.id] || 0) + 1
    if (attempts[t.id] < MAX_ATTEMPTS) {
      log(`↻ ${t.id} — planning failed (attempt ${attempts[t.id]}/${MAX_ATTEMPTS}), retrying.`)
      continue
    }
    failed.push({ taskId: t.id, blocker, attempts: attempts[t.id] })
    await flagFailedInTodo(t.id, `${blocker} (after ${attempts[t.id]} attempts)`)
    log(`❌ ${t.id} — planning failed after ${attempts[t.id]} attempts, flagged in ${TODO_PATH}.`)
    if (stopOnFailure) break
    continue
  }

  // Enforce {task-id}-{slug} plan naming — warn (don't hard-fail) if it drifted.
  if (!plan.planFile.includes(`${t.id}-`)) {
    log(`⚠ plan file "${plan.planFile}" does not follow {task-id}-{slug} naming for ${t.id}.`)
  }

  // CRITICAL escalation (§7.5): a task touching a CRITICAL.md path forces a
  // stronger implement model AND a mandatory review pass, regardless of the Plan
  // agent's recommendation.
  const escalated = plan.touchesCritical === true
  const baseModel = ALLOWED_MODELS.includes(plan.recommendedModel) ? plan.recommendedModel : 'opus'
  const baseEffort = ALLOWED_EFFORT.includes(plan.recommendedEffort) ? plan.recommendedEffort : 'high'
  const implModel = escalated ? 'opus' : baseModel
  const implEffort = escalated ? 'high' : baseEffort
  if (escalated) {
    log(`[${iter}] ⚠ CRITICAL escalation: ${t.id} touches ${(plan.criticalPathsTouched || []).join(', ') || 'a protected path'} → forcing opus/high + mandatory review.`)
  }
  log(`[${iter}] Plan ready (${plan.complexity}) → implement on ${implModel}/${implEffort}: ${plan.rationale || ''}`)

  // --- Phase Implement: on the model the Plan agent chose (forced up for
  // CRITICAL). Reads the plan file for context (the plan file is the bridge).
  // Non-critical: the implementer flips `- [x]` and commits after T1+T2.
  // Critical: the implementer does everything EXCEPT commit/flip — it stages the
  // work and hands to a mandatory Review that commits only after approval. ---
  const commitClause = escalated
    ? `5. CRITICAL TASK — do NOT commit and do NOT flip \`- [x]\` yourself. Stage your changes (\`git add\` the touched files) and set readyForReview=true. A mandatory reviewer will inspect and commit. Leave the working tree staged and coherent.`
    : `5. In ${TODO_PATH}, flip this task's \`- [ ]\` to \`- [x]\` and append \`_(done <today>; see docs/features/*)_\` in the same style as the other completed tasks — do NOT emit a \`Plan: .claude/plans/...\` link (those are local/gitignored and die elsewhere). Do not touch other tasks' lines. Then commit: stage the changed files and \`git commit\` with a short (max 2 lines) message like "${t.id}: <what landed>". Do NOT mention Claude or an author. Commit on the current branch (${branch}); do not push.`

  const res = await agent(
    `Implement task ${t.id} by executing the plan at ${plan.planFile}. Read that plan file FIRST — it is your source of truth and carries the planner's decisions.

Task: ${t.id}${t.stage ? ` (under: ${t.stage})` : ''}
${escalated ? `THIS IS A CRITICAL TASK (touches ${(plan.criticalPathsTouched || []).join(', ') || 'a protected path'}). Extra care; a reviewer will gate your commit.` : ''}

Steps — do ALL of them:
1. Read ${plan.planFile} and DECISIONS.md, then re-read ${TODO_PATH} for the task line and the neighboring code you will touch.
2. Implement the plan. Write real code that matches surrounding patterns — do not stub or fake behavior the task asks to be real. If the plan is wrong or incomplete, adapt and note the deviation in your summary. Never edit spec/ — propose spec changes in your summary instead.
3. T1 — run the project's test suite AND build AND lint/type-check and iterate until ALL GREEN. This gates the commit.
4. T2 — execute these ACCEPTANCE CRITERIA and confirm the artifact actually works, capturing what you ran and observed as acceptanceEvidence:
${(plan.acceptanceCriteria || '(none supplied — derive from the task line and exercise the artifact end-to-end)').toString().slice(0, 1500)}
${commitClause}

${VERIFICATION_LADDER}

${CONVENTIONS}

Report t1Pass, t2Pass, and acceptanceEvidence honestly. ${escalated ? 'Set success=false and readyForReview=true when code+T1+T2 are done and staged (the reviewer commits).' : 'Report success=true ONLY if T1 passed, T2 passed, TODO.md is marked `- [x]`, and the commit was made.'} If you hit an unresolvable blocker (failing test/lint you cannot fix, unmet acceptance, a genuinely missing dependency, irreducible ambiguity), stop, leave the working tree clean/coherent, and report success=false with the blocker — do not force a bad commit or a false checkbox.`,
    { label: `impl:${t.id}`, phase: 'Implement', agentType: 'general-purpose', model: implModel, effort: implEffort, schema: IMPLEMENT_SCHEMA },
  )

  // Determine outcome. For critical tasks, success is decided by the Review pass.
  let ok = res && res.success === true
  let reviewResult = null

  if (escalated && res && res.t1Pass && res.t2Pass && res.readyForReview) {
    // --- Phase Review: mandatory pre-commit review for CRITICAL tasks. ---
    reviewResult = await agent(
      `Mandatory pre-commit review of a CRITICAL task before it lands. Task ${t.id} touches protected path(s): ${(plan.criticalPathsTouched || []).join(', ') || '(a CRITICAL.md path)'}. The implementer completed the code and reports T1 (test+build+lint) and T2 (acceptance) both green, staged but NOT committed.

Do this:
1. Read the plan at ${plan.planFile} and the staged diff (\`git diff --staged\`).
2. Independently VERIFY T1 (re-run test + build + lint/type-check) and T2 (re-run the acceptance criteria: ${(plan.acceptanceCriteria || 'exercise the artifact end-to-end').toString().slice(0, 800)}). Confirm the change is safe and correct for this sensitive area — no secrets, no broken auth/migration/payment path, no spec/ edits.
3. If APPROVED: in ${TODO_PATH} flip ${t.id}'s \`- [ ]\` to \`- [x]\` with \`_(done <today>; reviewed; see docs/features/*)_\`, then commit the staged changes on branch ${branch} with "${t.id}: <what landed>" (no Claude/author mention; do not push). Set approved=true, committed=true.
4. If NOT approved: do NOT commit; leave findings in issues[], set approved=false, committed=false. You may leave the tree staged for a retry.

Report approved, committed, commitSubject, issues, summary.`,
      { label: `review:${t.id}`, phase: 'Review', agentType: 'general-purpose', model: 'opus', effort: 'high', schema: REVIEW_SCHEMA },
    )
    ok = reviewResult && reviewResult.approved === true && reviewResult.committed === true
    if (!ok && reviewResult) {
      log(`⚠ Review did not pass for ${t.id}: ${(reviewResult.issues || []).join('; ') || reviewResult.summary || 'not approved'}`)
    }
  }

  if (ok) {
    const commitSubject = (reviewResult && reviewResult.commitSubject) || res.commitSubject
    done.push({ ...res, planFile: plan.planFile, model: implModel, escalated, commitSubject })
    log(`✅ ${t.id} done${commitSubject ? ` — "${commitSubject}"` : ''} (T1✓ T2✓${escalated ? ' reviewed✓' : ''})`)

    // --- Phase Archive: capture the plan's SUBSTANCE into committed docs so the
    // reasoning survives even though .claude/plans/ is local/gitignored. ---
    await agent(
      `Archive the completed task ${t.id} into COMMITTED docs (its plan file .claude/plans/ is local/gitignored, so capture the SUBSTANCE, not a link).
1. Read ${plan.planFile} for the substance (decisions, files touched, seams, gotchas, acceptance result).
2. Append/merge a concise section into the appropriate docs/features/{area}.md (area = the task's feature slug, e.g. the "sla" in ${t.id}). Create the file if absent. Keep it status-free prose describing what was built and why — NO checkboxes/counts (those live only in TODO.md).
3. Append one entry to ${DECISIONS_PATH} (create if absent): date, task ${t.id}, the decision, rationale, and any gotchas learned.
4. Do NOT emit \`Plan: .claude/plans/...\` links anywhere. Then commit only the docs (\`git commit docs DECISIONS.md -m "${t.id}: archive"\`, path-scoped) on branch ${branch}; do not push.
Report archived, featureFile, decisionsUpdated.`,
      { label: `archive:${t.id}`, phase: 'Archive', agentType: 'general-purpose', model: 'sonnet', effort: 'low', schema: ARCHIVE_SCHEMA },
    )
  } else {
    const blocker = (reviewResult && !reviewResult.approved && ((reviewResult.issues || []).join('; ') || 'review rejected'))
      || (res && (res.blocker || res.summary))
      || 'agent returned no result'
    attempts[t.id] = (attempts[t.id] || 0) + 1
    if (attempts[t.id] < MAX_ATTEMPTS) {
      log(`↻ ${t.id} not completed (attempt ${attempts[t.id]}/${MAX_ATTEMPTS}), retrying: ${blocker}`)
      continue
    }
    failed.push({ taskId: t.id, blocker, attempts: attempts[t.id] })
    await flagFailedInTodo(t.id, `${blocker} (after ${attempts[t.id]} attempts)`)
    log(`❌ ${t.id} not completed after ${attempts[t.id]} attempts (flagged in ${TODO_PATH}): ${blocker}`)
    if (stopOnFailure) {
      log(`Halting the run (stopOnFailure). Un-flag ${t.id} in ${TODO_PATH} once fixed, then re-run to continue.`)
      break
    }
  }
  } catch (err) {
    // An agent() call threw — most likely the token budget was exhausted mid-task
    // (agent() throws once budget.spent() reaches budget.total). Break cleanly so
    // the final summary still reports everything completed so far.
    const msg = (err && err.message) || String(err)
    log(`Stopping: agent call failed mid-task (${msg}). Returning partial results.`)
    break
  }
}

if (iter >= MAX_TASKS) {
  log(`Reached the ${MAX_TASKS}-task safety cap; re-run to continue draining the plan.`)
}

// ---- Reconcile (F3) -------------------------------------------------------
// Do NOT trust the in-memory summary. Re-read TODO.md and git to verify every
// claimed-done task is actually `- [x]` AND committed; report any mismatch.
let reconcile = null
try {
  const claimed = done.map(t => t.taskId)
  reconcile = await agent(
    `Reconcile an autonomous run's claimed results against ground truth. Read-only except nothing (do not modify files).
The run CLAIMS these tasks were completed this session: ${claimed.length ? claimed.join(', ') : '(none)'}.

Verify against reality:
1. Read ${TODO_PATH} and list the task ids actually marked \`- [x]\` (done) now, plus count the \`- [ ]\` open ones.
2. Run \`git log --oneline -n 60\` and list task ids that appear in recent commit subjects.
3. Report mismatches: any claimed-done task that is NOT \`- [x]\`; any \`- [x]\` task with no commit; any committed task not checked off. Set consistent=true only if every claimed task is both \`- [x]\` and committed with no surprises.

Return checkedInTodo, committedTasks, mismatches, openRemaining, consistent.`,
    { label: 'reconcile', phase: 'Reconcile', agentType: 'general-purpose', model: 'haiku', effort: 'low', schema: RECONCILE_SCHEMA },
  )
  if (reconcile && reconcile.consistent === false) {
    log(`⚠ RECONCILE found mismatches: ${(reconcile.mismatches || []).join(' | ') || '(unspecified)'}`)
  } else if (reconcile) {
    log(`Reconcile OK — ${(reconcile.checkedInTodo || []).length} done in TODO.md, ${reconcile.openRemaining} still open.`)
  }
} catch (err) {
  log(`Reconcile step could not run: ${(err && err.message) || String(err)}`)
}

// ---- Return ---------------------------------------------------------------
return {
  branch,
  scope: scope || '(all tasks)',
  implemented: done.map(t => ({ taskId: t.taskId, model: t.model, escalated: !!t.escalated, commit: t.commitSubject, t1Pass: t.t1Pass, t2Pass: t.t2Pass, files: t.filesChanged })),
  // Each failed task was flagged `- [!]` in TODO.md for follow-up; un-flag to retry on a later run.
  failed: failed.map(f => ({ ...f, flaggedInTodo: true })),
  reconciliation: reconcile
    ? { consistent: reconcile.consistent, mismatches: reconcile.mismatches || [], openRemaining: reconcile.openRemaining, checkedInTodo: reconcile.checkedInTodo || [] }
    : { consistent: null, note: 'reconcile step did not run' },
  stats: { implemented: done.length, failed: failed.length, iterations: iter },
}
