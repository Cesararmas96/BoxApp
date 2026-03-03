# /sdd-status — Show Task Status

Read `sdd/tasks/.index.json` and print a human-friendly status report.

## Usage
```
/sdd-status
/sdd-status <feature-name>   (filter by feature)
```

## Agent Instructions

Read `sdd/tasks/.index.json` and output:

```
📊 SDD Status — <feature-name>
Spec: docs/sdd/specs/<feature>.spec.md

  ID        Priority  Effort  Status       Assigned       Title
  ────────────────────────────────────────────────────────────────────
  TASK-001  high      S       ✅ done      session-abc    Setup structure
  TASK-002  high      M       🔄 progress  session-def    Base UI component
  TASK-003  high      L       ⏳ pending   —              Theme Switcher
  TASK-004  high      L       🔒 blocked   —              Dashboard layout

Progress: X/N done (XX%)
Unblocked & unassigned: TASK-003, ... ← ready to assign
```

Status icons:
- ✅ done
- 🔄 in-progress
- ⏳ pending (unblocked, ready to start)
- 🔒 blocked (dependencies not complete)

If `sdd/tasks/.index.json` does not exist, inform the user to run `/sdd-task` first.
