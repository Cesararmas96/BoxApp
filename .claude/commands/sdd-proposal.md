# /sdd-proposal — Feature Proposal & Discussion

Propose a frontend feature idea in plain, non-technical language. The agent discusses
the idea with you, then generates a formal SDD specification.

## Usage
```
/sdd-proposal <feature-title> [-- free-form notes]
```

## Agent Instructions

When this command is invoked:

1. Parse **feature-title** (first token before `--`). If not provided, ask.
2. If `--` present: use everything after as initial context.

3. Scaffold `sdd/proposals/<feature-title>.proposal.md` using the template
   at `sdd/templates/proposal.md`. Pre-fill with any free-form notes.

4. Walk through each section with the user, asking:
   - **Motivation**: What problem does this solve? Who is affected? Why now?
   - **Scope**: What new UI capabilities or routes? What behavior changes? What's NOT changing?
   - **Impact**: Which existing components/pages are affected? Breaking changes? New dependencies?
   - **Open Questions**: Uncertainties? Alternative UX approaches considered?

5. Update the proposal document with answers as you go.

6. Present a summary:
   ```
   📋 Proposal Summary: <feature-title>

   Why:    <one-line motivation>
   What:   <one-line scope>
   Impact: <affected areas>
   ```

7. Ask: **"Ready to generate a formal spec from this proposal?"**
   - If yes: run `/sdd-spec` logic internally using proposal content to pre-fill the spec.
     Link the proposal to the spec and mark `status: accepted`.
   - If no: leave as `status: discussion` for further iteration.

## Output
```
✅ Proposal saved: sdd/proposals/<feature-title>.proposal.md
Next: Review, then run /sdd-spec <feature-title> or accept auto-generated spec.
```
