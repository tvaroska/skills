---
description: Manage the subrepo registry for multi-repo workflows
argument-hint: Optional subcommand (add <dir>, remove <dir>, setup <dir>)
---

# Manage Repos

Manage the subrepo registry (`.repos.json`) for multi-repo gen-3 workflows. Each
subrepo carries its own Option-A layout (`TODO.md`, `DECISIONS.md`, `CRITICAL.md`,
`spec/`, `design/`, `docs/`).

## Detect Context

1. Check if `.repos.json` exists in the current directory.
   - If not found, inform the user: "No multi-repo workspace detected. Run `/setup`
     with the multi-repo option to initialize, or create `.repos.json` manually."

2. Read `.repos.json` to get the current repo list.

## Parse Subcommand

Parse `$ARGUMENTS` to determine the action:

- **No arguments or `list`** → List repos
- **`add <dir>`** → Add a subrepo
- **`remove <dir>`** → Remove a subrepo
- **`setup <dir>`** → Run setup for a specific subrepo

---

## Action: List (default)

For each repo in `.repos.json`:

1. Check if `{repo.path}/TODO.md` exists.
2. If yes, count open (`- [ ]`), done (`- [x]`), and failed (`- [!]`) tasks.
3. Check if `{repo.path}/spec/` exists (gen-3 doc layout present).

Display (surface `- [!]` failed tasks — do not hide them):

```
Multi-Repo Workspace
====================

Repo         Path          TODO.md   Open   Failed   Spec
────────────────────────────────────────────────────────────
central      .             yes       5      0        yes
api          api/          yes       3      1        yes
frontend     frontend/     no        —      —        no

Commands: /repos add <dir> | /repos remove <dir> | /repos setup <dir>
```

---

## Action: Add

1. Validate that the directory `$DIR` exists in the current workspace.
   - If not: "Directory '{dir}' not found. Create it first or clone the repo there."

2. Check if it is already registered in `.repos.json`.
   - If yes: "'{dir}' is already registered."

3. Add the entry to `.repos.json`:
   ```json
   { "name": "{dir}", "path": "{dir}" }
   ```

4. Check `.gitignore` — if `{dir}` / `{dir}/` is not listed, append `{dir}/`.

5. Report:
   ```
   Added repo: {dir}
   Path: {dir}/
   Added to .gitignore: yes/already present

   Run /repos setup {dir} to initialize the gen-3 workflow files.
   ```

---

## Action: Remove

1. Check if `{dir}` is registered in `.repos.json`.
   - If not: "'{dir}' is not registered."

2. Remove the entry from `.repos.json`.

3. **Do NOT** delete the directory or its files — only unregister.

4. **Do NOT** remove it from `.gitignore` — leave that to the user.

5. Report:
   ```
   Removed repo: {dir}
   Note: Directory and files were not deleted. Remove from .gitignore manually if needed.
   ```

---

## Action: Setup

1. Check if `{dir}` is registered in `.repos.json`.
   - If not, ask: "'{dir}' is not registered. Register it first?" If yes, run the
     Add action first.

2. Run the `/setup` workflow scoped to `{dir}/` (gen-3 Option-A layout):
   - All files (`TODO.md`, `DECISIONS.md`, `CRITICAL.md`, `spec/`, `design/`,
     `docs/`, etc.) are created inside `{dir}/`.
   - Use the same level selection and questions as `/setup`.
   - Replace `{PROJECT_NAME}` with the repo name from `.repos.json`.
   - Add a `**Repo:** {repo.name}` line to the generated TODO.md header.
   - If the subrepo already has a legacy layout (`PLAN.md`/`wiki/`), point the user
     to `/realign` instead of setting up.

3. Report:
   ```
   Setup complete for repo: {dir}
   Files created in {dir}/
   ```
