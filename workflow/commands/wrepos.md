---
description: Manage subrepo registry for multi-repo workflows
argument-hint: Optional subcommand (add <dir>, remove <dir>, setup <dir>)
---

# Manage Repos

Manage the subrepo registry (`.repos.json`) for multi-repo workflows.

## Detect Context

1. Check if `.repos.json` exists in the current directory.
   - If not found, inform user: "No multi-repo workspace detected. Run `/setup` with multi-repo option to initialize, or create `.repos.json` manually."

2. Read `.repos.json` to get the current repo list.

## Parse Subcommand

Parse `$ARGUMENTS` to determine action:

- **No arguments or `list`** → List repos
- **`add <dir>`** → Add a subrepo
- **`remove <dir>`** → Remove a subrepo
- **`setup <dir>`** → Run setup for a specific subrepo

---

## Action: List (default)

For each repo in `.repos.json`:

1. Check if `{repo.path}/TODO.md` exists
2. If yes, count open tasks (`- [ ]`) and completed tasks (`- [x]`)
3. Check if `{repo.path}/docs/` exists

Display:

```
Multi-Repo Workspace
====================

Repo         Path          TODO.md   Open Tasks   Docs
─────────────────────────────────────────────────────────
central      .             yes       5            yes
api          api/          yes       3            yes
frontend     frontend/     no        —            no

Commands: /repos add <dir> | /repos remove <dir> | /repos setup <dir>
```

---

## Action: Add

1. Validate that the directory `$DIR` exists in the current workspace
   - If not, inform user: "Directory '{dir}' not found. Create it first or clone the repo there."

2. Check if already registered in `.repos.json`
   - If yes, inform user: "'{dir}' is already registered."

3. Add entry to `.repos.json`:
   ```json
   { "name": "{dir}", "path": "{dir}" }
   ```

4. Check `.gitignore` — if `{dir}` or `{dir}/` is not listed, append `{dir}/` to `.gitignore`

5. Report:
   ```
   Added repo: {dir}
   Path: {dir}/
   Added to .gitignore: yes/already present

   Run /repos setup {dir} to initialize workflow files.
   ```

---

## Action: Remove

1. Check if `{dir}` is registered in `.repos.json`
   - If not, inform user: "'{dir}' is not registered."

2. Remove the entry from `.repos.json`

3. **Do NOT** delete the directory or its files — only unregister

4. **Do NOT** remove from `.gitignore` — leave that to the user

5. Report:
   ```
   Removed repo: {dir}
   Note: Directory and files were not deleted. Remove from .gitignore manually if needed.
   ```

---

## Action: Setup

1. Check if `{dir}` is registered in `.repos.json`
   - If not, ask: "'{dir}' is not registered. Register it first?" If yes, run the Add action first.

2. Run the setup workflow scoped to `{dir}/`:
   - All files (TODO.md, docs/, etc.) are created inside `{dir}/`
   - Use the same level selection and questions as `/setup`
   - Replace `{PROJECT_NAME}` with the repo name from `.repos.json`
   - Add `**Repo:** {repo.name}` line to the generated TODO.md header

3. Report:
   ```
   Setup complete for repo: {dir}
   Files created in {dir}/
   ```
