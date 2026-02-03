---
name: db-migration-wizard
description: Manages SQL migrations and schema changes for Supabase using the local CLI.
---

# Skill: Database Migration Wizard

## Purpose
To ensure database changes are version-controlled and reproducible across local, staging, and production environments.

## Instructions
1. **Creation:** Generate a new migration file: `supabase migration new <description>`.
2. **SQL Generation:** Write clean PostgreSQL syntax for `CREATE TABLE`, `ALTER TABLE`, or adding indexes.
3. **Local Sync:** Prompt the user to run `supabase db reset` to test the migrations locally.
4. **Diffing:** Use `supabase db diff` to detect changes made via the Supabase UI and bring them into local files.

## Constraints
- Avoid destructive `DROP` commands without explicit user confirmation.
- Ensure every table has a Primary Key and timestamps (`created_at`).