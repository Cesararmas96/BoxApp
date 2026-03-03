# /sdd-start — Start an SDD Task

Pick up a task from the SDD task index, validate readiness, mark in-progress,
and begin implementation.

## Usage
```
/sdd-start TASK-004
/sdd-start theme-switcher-component
```

Accept either the full ID (`TASK-NNN`) or the slug. If nothing is provided,
run `/sdd-next` logic and ask the user to pick one.

## Agent Instructions

1. **Resolve the task**: Read `sdd/tasks/.index.json`, match by `id` or `slug` (case-insensitive).
   If no match, list available tasks and ask the user to pick one.

2. **Validate readiness**:
   - Status must be `"pending"`. If `"in-progress"`, warn and ask to confirm resume. If `"done"`, abort.
   - All `depends_on` tasks must be `"done"`. If blocked, print:
     ```
     ❌ TASK-<NNN> is blocked.
        Waiting on: TASK-<X> (<status>), TASK-<Y> (<status>)
     ```
     and STOP.

3. **Mark in-progress**: Update both `sdd/tasks/.index.json` (status + assigned_to)
   and the task markdown file header.

4. **Read context**: Read the task file and the referenced spec file.

5. **Print kickoff summary**:
   ```
   🚀 Starting TASK-<NNN>: <title>
      Feature: <feature>  |  Priority: <priority>  |  Effort: <effort>

   📋 Scope: ...
   📂 Files: ...
   ✅ Acceptance Criteria: ...
   ```

6. **Begin implementation** — this is the core purpose:
   - Actually write the code — create/modify the files listed in the task scope.
   - Run linting: `npm run lint` or `npx eslint`.
   - Run tests: `npx vitest run` and/or `npx playwright test` as specified.
   - Run type check: `npx svelte-check`.
   - On completion, move task file to `sdd/tasks/completed/`, update index → `"done"`,
     and fill in the Completion Note.

   **⚠ STOP only if**: dependency missing, spec ambiguous, or tests failing unfixably.
   Otherwise, keep going until done.
