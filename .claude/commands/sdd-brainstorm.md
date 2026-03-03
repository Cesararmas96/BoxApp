# /brainstorm — Structured Idea Exploration

Explore a feature idea by generating multiple approaches with library and code references,
then produce a brainstorm document that feeds directly into `/sdd-spec`.

```
/brainstorm → (review) → /sdd-spec → /sdd-task → implement
```

## Guardrails
- **No implementation code** — this is about ideas, references, and tradeoffs.
- Output is a brainstorm document, not a spec or task.
- Always use the template at `sdd/templates/brainstorm.md`.
- Include concrete library/package references with versions when possible.
- Reference existing codebase components that would be reused or extended.

## Steps

### 1. Parse Input
Extract from the user's invocation:
- **topic / feature-name**: slug-friendly, kebab-case. If not provided, ask.
- **free-form notes**: anything after `--`, used as initial context.

### 2. Understand the Goal
Before generating options, establish:
- **Problem**: What specific problem are we solving?
- **User**: Who is affected? (end users, developers, ops)
- **Constraints**: Performance, browser compatibility, accessibility, UX standards, existing patterns.

If the user provided notes, extract these from context. Otherwise, ask briefly.

### 3. Research the Codebase
Scan the project for relevant existing components:
- Search for related Svelte components, stores, and routes.
- Identify reusable code that any solution should build on.
- Note existing dependencies in `package.json` that could be leveraged.

### 4. Generate Options
Produce **at least 3** distinct approaches. For each option:
- Descriptive name and explanation (WHAT, not HOW).
- Pros and cons (be honest about tradeoffs).
- Effort estimate (Low / Medium / High).
- **Libraries / Tools**: table of packages with purpose and notes.
- **Existing Code to Reuse**: specific paths and descriptions.

Include at least one unconventional or less obvious approach.

### 5. Recommend
Select one option and explain the reasoning:
- Reference specific tradeoffs from the options.
- Explain what you're trading off and why it's acceptable.

### 6. Describe the Feature
Write a detailed feature description based on the recommended option:
- **User-facing behavior**: what the user sees/experiences, UI interactions.
- **Internal behavior**: high-level flow and responsibilities (no code).
- **Edge cases & error handling**: boundary conditions, failure modes.

### 7. Map to SDD Structures
Fill in the remaining template sections:
- **Capabilities**: new and modified (kebab-case identifiers).
- **Impact & Integration**: affected components/pages table.
- **Open Questions**: unresolved items with owners.

### 8. Save the Document
1. Read the template at `sdd/templates/brainstorm.md`.
2. Create `sdd/proposals/<feature-name>.brainstorm.md` with today's date.
3. Set `Status: exploration`.

### 9. Output
```
✅ Brainstorm saved: sdd/proposals/<feature-name>.brainstorm.md

   Recommended: Option <X> — <name>
   Effort: <Low|Medium|High>
   Open questions: <count>

Next steps:
  - Review and refine the brainstorm
  - When ready: /sdd-spec <feature-name> (uses brainstorm as input)
```

## How sdd-spec Consumes This Document

When `/sdd-spec` is invoked with a feature name that has a `.brainstorm.md` in `sdd/proposals/`:
- **Problem Statement** → Spec Section 1 (Motivation & Business Requirements)
- **Constraints** → Spec Section 5 (Acceptance Criteria)
- **Recommended Option** → Spec Section 2 (Architectural Design)
- **Libraries / Tools** → Spec Section 6 (External Dependencies)
- **Feature Description** → Spec Section 2 (Overview + Integration Points)
- **Capabilities** → Spec Section 3 (Module Breakdown)
- **Impact & Integration** → Spec Section 2 (Integration Points)
- **Open Questions** → Spec Section 7

## Reference
- Brainstorm template: `sdd/templates/brainstorm.md`
- Proposal template: `sdd/templates/proposal.md`
- Spec template: `sdd/templates/spec.md`
- SDD methodology: `sdd/WORKFLOW.md`
