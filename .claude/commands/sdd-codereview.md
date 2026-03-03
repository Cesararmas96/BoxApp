# /sdd-codereview — Code Review a Completed Task

Perform a structured code review over the implementation produced by a completed SDD task.
Reads the task file from `sdd/tasks/completed/`, loads every referenced file, and applies the
code review analysis checklist. Produces a summary report with severity-tagged findings.

## Guardrails
- Do NOT modify any source files — this workflow is **read-only analysis**.
- Do NOT re-open or change the status of a completed task.
- Review only the files listed in the task's "Files to Create / Modify" table.
- If the task references a spec, read it for full acceptance context.

## Usage
```
/sdd-codereview TASK-001
/sdd-codereview TASK-002-layout-component
/sdd-codereview sdd/tasks/completed/TASK-001-theme-switcher.md
```

Accept a full ID (`TASK-NNN`), a slug, or a relative/absolute path.
If nothing is provided, list the files in `sdd/tasks/completed/` and ask the user to pick one.

## Agent Instructions

When this command is invoked:

### 1. Resolve the Completed Task
1. If the user gave a path, read it directly.
2. Otherwise, scan `sdd/tasks/completed/` for a filename matching `TASK-<NNN>*` or `*<slug>*`.
3. If no match is found, list available completed tasks and ask the user to choose.

### 2. Parse the Task File
Extract from the task markdown:
- **Title** and **Feature**
- **Spec path** (for context)
- **Scope** section — what was implemented
- **Files to Create / Modify** table — the file list to review
- **Implementation Notes** — patterns and constraints the code should follow
- **Acceptance Criteria** — checklist to verify
- **Test Specification** — expected test coverage
- **Completion Note** — any deviations noted by the implementing agent

### 3. Load Referenced Sources
1. Read every file listed in the "Files to Create / Modify" table.
2. If a **spec file** is referenced, read it for requirement context.
3. If code references other codebase files (e.g., base components, shared stores), load those too.

### 4. Run Code Review Analysis
Evaluate each dimension across all loaded files:

| # | Dimension | Focus |
|---|-----------|-------|
| 1 | **Correctness** | Logic bugs, edge cases, error handling, type safety |
| 2 | **Security** | Input validation/sanitization, XSS/CSRF, hardcoded secrets/credentials, data exposure, dependency vulnerabilities |
| 3 | **Performance** | Unnecessary re-renders, redundant reactive statements, unnecessary loops/iterations, bundle size impact, lazy loading |
| 4 | **Code Quality** | DRY (no duplicate code), naming, readability, formatting, unnecessary complexity |
| 5 | **Architecture** | SOLID principles, Svelte 5 patterns (runes, snippets), SvelteKit conventions, proper abstraction level, component composition |
| 6 | **Testing** | Vitest unit coverage, Playwright E2E coverage, edge-case tests, meaningful assertions |
| 7 | **Documentation** | JSDoc comments, self-documenting code, public API docs |
| 8 | **Logic & Hallucinations** | Chain of thought (verifiable logic path), edge cases (empty states, timeouts, partial failures), phantom APIs/imports, fabricated patterns, signature consistency |

For each finding, use severity tags:
- 🔴 **Critical** — must fix before production
- 🟠 **Important** — should fix, impacts maintainability or correctness
- 🟡 **Suggestion** — nice-to-have improvement
- 💡 **Nitpick** — style or preference

### 5. Verify Acceptance Criteria
Cross-check the task's acceptance criteria against the actual implementation:
- Mark each criterion as ✅ met or ❌ not met.
- If the task included test specifications, verify corresponding tests exist and are meaningful.

### 6. Produce the Review Report
Output a structured report in this format:

```
📝 Code Review: TASK-<NNN> — <title>
   Feature: <feature>
   Spec: <spec path>
   Files reviewed: <count>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Summary
<1-3 sentence overall assessment>

## Findings

### <file path>

<severity> <issue title>
  Location: line <N>
  Issue: <description>
  Suggestion: <recommendation>

  ```svelte
  <!-- suggested fix (if applicable) -->
  ```

### <next file>
...

## Acceptance Criteria Verification

- ✅ <criterion 1>
- ✅ <criterion 2>
- ❌ <criterion N> — <reason>

## Scorecard

| Dimension              | Rating | Notes |
|------------------------|--------|-------|
| Correctness            | ⭐⭐⭐⭐⭐ |       |
| Security               | ⭐⭐⭐⭐   |       |
| Performance            | ⭐⭐⭐⭐⭐ |       |
| Code Quality           | ⭐⭐⭐⭐   |       |
| Architecture           | ⭐⭐⭐⭐⭐ |       |
| Testing                | ⭐⭐⭐     |       |
| Documentation          | ⭐⭐⭐⭐   |       |
| Logic & Hallucinations | ⭐⭐⭐⭐   |       |

Overall: <X>/5

## Recommendations
1. <top priority action>
2. <second priority action>
...
```

### 7. Save the Report (Optional)
If the user requests it, save the report to:
```
sdd/reviews/TASK-<NNN>-review.md
```

## Reference
- Completed tasks: `sdd/tasks/completed/`
- Task index: `sdd/tasks/.index.json`
- SDD methodology: `sdd/WORKFLOW.md`
