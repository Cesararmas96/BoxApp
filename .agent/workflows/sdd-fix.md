---
description: Fix a bug found in a completed or in-progress SDD task
---

# /sdd-fix — Fix a Bug in an Existing SDD Task

## Guardrails
- Read in layers — only load what diagnosis requires, not everything upfront.
- Never reopen a `done` task. Always create a new fix task.
- Never fix outside the bug scope.
- Always add a regression test.
- Use `TODO: (Agent)` if the fix is a workaround.

## Input
```
/sdd-fix TASK-003
/sdd-fix TASK-003 -- TypeError: $authStore is not a function at Header.svelte:14
```

---

## Steps

### 1. Parse
- Source task ID → required. If missing, ask.
- Text after `--` → initial symptom (may be empty).

### 2. Load in Layers (stop when you have enough to diagnose)

**Layer 1 — always read:**
- `./sdd/tasks/.index.json` → task entry (status, files, spec path, depends_on)
- Source task file → scope, implementation notes, affected files, completion note

**Layer 2 — read only if layer 1 is insufficient:**
- Spec file (referenced in task header) → requirements, edge cases, architecture
- Only the **specific code files** related to the reported symptom (not all files in the task)

**Layer 3 — read only if a design decision is in question:**
- `./sdd/proposals/<feature>.brainstorm.md` → tradeoffs and rejected options

> Skip layers you don't need. The goal is diagnosis, not full re-reading of the project.

### 3. Ask Only What You Cannot Infer

If `--` symptom is clear enough → skip to Step 4.

Otherwise, one message, only the gaps:
```
📋 TASK-<NNN>: <title>  |  Archivos: <list>

❓ ¿Cuál es el error exacto? (mensaje, stack trace o síntoma)
❓ ¿Cómo se reproduce?
```

### 4. Diagnose and Confirm

Trace the bug to its exact location. Then print:

```
🔍 TASK-<NNN> — <title>
   Causa    : <one-liner>
   Archivo  : <file>:<line>
   Cambia   : <file1>, <test file>
   Bloquea  : <TASK-X> | ninguna
   Plan     : 1) <change>  2) <change>  3) regression test: <case>
¿Arrancamos?
```

Wait for confirmation. If corrected, update and re-confirm.

### 5. Act by Scenario

**A — task `in-progress`:** fix in place, run tests, complete original task. Done.

**B — task `done`:** create fix task → implement → close.

Fix task header (write to `./sdd/tasks/active/TASK-<NNN>-fix-<slug>.md`):
```
**Feature / Spec / Type:fix / Priority:high / Depends-on:TASK-<source> / Fixes:TASK-<source>**

## Bug: <symptom> | Root cause: <line ref> | Reproduces: <steps>
## Scope: fix <issue> in <file> + regression test. NOT in scope: refactoring.
## Files: <file> MODIFY | <test> MODIFY
## Criteria: bug gone + regression test passes + all tests pass + no lint errors
```

Update `./sdd/tasks/.index.json` with the new entry before writing any code.

### 6. Implement

1. Apply minimal fix.
2. Add regression test for the exact failing case.
3. Lint + tests → all green.
4. Move task to `./sdd/tasks/completed/`, update index → `"done"`, fill Completion Note.

### 7. Output
```
✅ TASK-<NNN> — <title>
   Causa: <one-liner> | Archivos: <list> | Regression test: ✅
Next: /sdd-next | /sdd-codereview TASK-<NNN>
```

## Reference
- `./sdd/tasks/.index.json` · `./sdd/templates/task.md` · `./sdd/WORKFLOW.md`
