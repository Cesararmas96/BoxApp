# /sdd-spec — Scaffold a Feature Specification

Scaffold a new Feature Specification for Navigator Frontend using the SDD methodology.

## Usage
```
/sdd-spec <feature-name> [-- free-form description and notes]
```

## Agent Instructions

When this command is invoked:

1. Parse **feature-name** (first token before `--`). If not provided, ask.
2. If `--` present: use everything after as Problem Statement.

3. Check for existing brainstorm or proposal in `sdd/proposals/`:
   - `<feature-name>.brainstorm.md` — structured exploration with options and recommendation.
   - `<feature-name>.proposal.md` — discussion-based proposal.
   If found, **pre-fill the spec** using the brainstorm sections (Problem Statement → Motivation,
   Recommended Option → Architecture, Libraries → Dependencies, Capabilities → Module Breakdown,
   Impact → Integration Points, Open Questions → Open Questions). Skip questions already covered.

4. Ask the user for any **remaining gaps** (you can ask all at once):
   - **Motivation**: What problem does this feature solve? Why now?
   - **Key components**: What are the main UI components, routes, or stores involved?
   - **Integration points**: Which existing frontend components/APIs does this touch?
   - **Acceptance criteria**: How do we know it's done?
   - **Non-goals**: What is explicitly out of scope?

5. Read the template at `sdd/templates/spec.md`.

6. Assign a Feature ID: check existing specs in `sdd/specs/` and increment.
   If none exist, start at `FEAT-001`.

7. Create `sdd/specs/<feature-name>.spec.md` with the template filled in.
   Use your knowledge of the codebase to suggest architectural patterns:
   - Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`)
   - SvelteKit patterns (`+page.svelte`, `+page.server.ts`, `+server.ts`)
   - Flowbite Svelte components
   - Existing stores and utilities in `src/lib/`

8. Set `Status: draft`.

9. Remind the user:
   - Review and refine the spec before running `/sdd-task`
   - Mark the spec `status: approved` when ready
   - The spec is the SSOT — changes to requirements go here first

## Output
```
✅ Spec created: docs/sdd/specs/<feature-name>.spec.md
   Feature ID: FEAT-<NNN>
Next: Review the spec, then run /sdd-task docs/sdd/specs/<feature-name>.spec.md
```
