---
name: supabase-rls-manager
description: Generates and audits PostgreSQL Row Level Security (RLS) policies for Supabase tables.
---

# Skill: Supabase RLS Manager

## Purpose
Enforces a Zero-Trust security model at the database level, ensuring users can only access data they are authorized to see.

## Instructions
1. **Policy Generation:** Generate SQL migration files under `supabase/migrations/`.
2. **Context Awareness:** Identify if the policy is for `SELECT`, `INSERT`, `UPDATE`, or `DELETE`.
3. **Auth Integration:** Use `auth.uid()` to compare against the table's `user_id` or owner columns.
4. **Audit:** Scan existing tables and warn the user if RLS is disabled (`ALTER TABLE name DISABLE ROW LEVEL SECURITY`).

## Example
**User Input:** "Prevent users from deleting posts that don't belong to them."
**Agent Action:**
`CREATE POLICY "Users can only delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);`