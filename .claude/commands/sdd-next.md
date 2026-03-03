# /sdd-next — Suggest Next Tasks to Assign

Read `sdd/tasks/.index.json`, identify unblocked tasks, and suggest assignments.

## Usage
```
/sdd-next
/sdd-next <N>   (show top N unblocked tasks)
```

## Agent Instructions

1. Read `sdd/tasks/.index.json`. If it does not exist, inform the user to run `/sdd-task` first.

2. A task is **unblocked and ready** when:
   - Status is `"pending"`
   - ALL tasks in `depends_on` have status `"done"`

3. Sort by priority: `high` → `medium` → `low`. Show top N (default: all).

4. Print:
   ```
   🚀 Next unblocked tasks ready to assign:

     TASK-003  [high/L]  Theme Switcher component
     TASK-004  [high/L]  Dashboard layout

   These can run in parallel. To start a task:
     /sdd-start TASK-003
   ```

   If none available:
   ```
   ⏸️  No unblocked tasks available.
       All pending tasks have unmet dependencies.
       Run /sdd-status to see the full board.
   ```
