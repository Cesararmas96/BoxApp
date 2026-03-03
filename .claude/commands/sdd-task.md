# /sdd-task — Generate Task Artifacts from a Spec

Read an approved Feature Specification and decompose it into discrete,
self-contained Task Artifacts.

## Usage
```
/sdd-task <spec-file>
/sdd-task docs/sdd/specs/dashboard-widgets.spec.md
```

## Agent Instructions

When this command is invoked:

1. **Read the spec** file. Verify `status: approved`. If not, remind the user to approve first.

2. **Determine task numbering**: check `sdd/tasks/.index.json` for existing tasks.
   Continue the sequence (e.g., if highest is TASK-007, start at TASK-008).
   If no index exists, start at TASK-001.

3. **Decompose into tasks**: Map each module/component from the spec's breakdown into tasks.
   For each task, determine:
   - Title (imperative: "Implement ThemeSwitcher component")
   - Priority: `high` | `medium` | `low`
   - Estimated effort: `S` (<2h) | `M` (2-4h) | `L` (4-8h) | `XL` (>8h)
   - Dependencies (other TASK-IDs or `none`)
   - Scope — exactly what to implement
   - Files to create/modify (concrete paths: `src/lib/`, `src/routes/`, `tests/`)
   - Acceptance criteria including `npx vitest` and `npx svelte-check` commands
   - Test specification in TypeScript/Vitest format

4. **Build dependency graph**: Foundation tasks first (stores, base components),
   parallel tasks at same depth, integration/E2E tasks last.

5. **Create task files**: Read template at `docs/sdd/templates/task.md`.
   Write each to `sdd/tasks/active/TASK-<NNN>-<slug>.md`.

6. **Create/update index**: Write `sdd/tasks/.index.json` with schema:
   ```json
   {
     "feature": "<name>",
     "spec": "docs/sdd/specs/<feature>.spec.md",
     "created_at": "<ISO-8601>",
     "tasks": [{ "id", "slug", "title", "status", "priority", "effort", "depends_on", "assigned_to", "file" }]
   }
   ```

## Output
```
✅ Generated <N> tasks from spec: docs/sdd/specs/<feature>.spec.md

  ID        Priority  Effort  Depends-on    Title
  ───────────────────────────────────────────────────
  TASK-001  high      S       none          <title>
  TASK-002  high      M       TASK-001      <title>

Dependency graph:
  <tree>

Next: Run /sdd-status or /sdd-next to begin.
```
