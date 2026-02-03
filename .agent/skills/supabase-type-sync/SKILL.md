---
name: supabase-type-sync
description: Synchronizes PostgreSQL schema from Supabase into TypeScript definitions for the local SvelteKit project.
---

# Skill: Supabase Type Synchronizer

## Purpose
Ensures the AI agent and the developer have access to real-time database schemas, preventing runtime errors and enabling full IDE autocomplete.

## Instructions
1. **Execution:** Run the following CLI command to update types:
   `npx supabase gen types typescript --project-id <your-project-id> > src/lib/types/database.types.ts`
2. **Integration:** Ensure `src/app.d.ts` maps the generated `Database` interface to `SvelteKit` locals.
3. **Validation:** Before generating any query, verify the table and column names against the generated `database.types.ts`.

## Constraints
- Never manually edit `database.types.ts`.
- Always prompt the user to run the sync command after making changes to the database via the Supabase Dashboard.