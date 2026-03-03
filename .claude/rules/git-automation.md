---
trigger: always_on
---

# Automated Git Commits

## 1. Feature Completion Commit
- **Automatic Action**: Once a new feature is fully implemented, all bugs are resolved, and the code is verified (e.g., via browser inspection or local build), the agent MUST perform a git commit.
- **Commit Pattern**: Use the Conventional Commits specification as defined in `team-collaboration.md`.
- **Proactive Staging**: Always run `git add .` before committing unless specific files need to be excluded.
- **Description**: The commit message should concisely reflect the complete scope of the newly added feature.
