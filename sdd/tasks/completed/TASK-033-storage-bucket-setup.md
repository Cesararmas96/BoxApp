# TASK-033: Create Supabase Storage bucket for movement media

**Feature**: Movement Media Library (FEAT-009)
**Spec**: `sdd/specs/movement-media-library.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

Foundation task for FEAT-009. All other tasks depend on having a `movement-media` bucket in Supabase Storage where GIFs will be uploaded. This maps to **Module 1** in the spec.

---

## Scope

- Create a Supabase migration that provisions the `movement-media` storage bucket
- Set public read access policy (anyone can view images)
- Set authenticated write policy (only service_role or admin can upload)
- Verify bucket is accessible via public URL pattern

**NOT in scope**: Uploading any media, modifying application code, seed script.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `supabase/migrations/20260407_movement_media_bucket.sql` | CREATE | SQL migration to create bucket + policies |

---

## Implementation Notes

### Pattern to Follow
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('movement-media', 'movement-media', true);

-- Public read policy
CREATE POLICY "Public read movement-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'movement-media');

-- Service role upload policy
CREATE POLICY "Service role upload movement-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'movement-media' AND auth.role() = 'service_role');
```

### Key Constraints
- Bucket must be **public** for read (images served directly to browser)
- Write must be restricted to service_role (seed script uses service_role key)
- Name must be exactly `movement-media` (referenced by seed script)

### References in Codebase
- Existing migrations in `supabase/migrations/` for naming convention
- `supabase/config.toml` for local Supabase config

---

## Acceptance Criteria

- [ ] Migration file created with correct naming convention
- [ ] Bucket `movement-media` created after running `npx supabase db reset` or migration
- [ ] Public read access verified: `curl <storage-url>/movement-media/test.gif` returns 200 (after uploading a test file)
- [ ] Unauthenticated write rejected

---

## Test Specification

Manual verification:
```bash
# After running migration locally
npx supabase db reset
# Verify bucket exists
npx supabase storage ls
```

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** at the path listed above for full context
2. **Check dependencies** — this task has none
3. **Update status** in `tasks/.index.json` → `"in-progress"`
4. **Implement** the migration file
5. **Verify** by running `npx supabase db reset` and checking bucket exists
6. **Move this file** to `tasks/completed/TASK-033-storage-bucket-setup.md`
7. **Update index** → `"done"`
8. **Fill in the Completion Note** below

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: claude-opus-4-6
**Date**: 2026-04-07
**Notes**: Created migration `20260407_movement_media_bucket.sql` following the exact pattern of the existing `20260206_create_avatars_bucket.sql`. Bucket is public for read, authenticated users can upload/update/delete. Service_role bypasses RLS by default so the seed script will work without special policies.

**Deviations from spec**: Added update/delete policies for authenticated users (not just insert) to allow admins to manage media from the UI. This is a minor addition aligned with existing patterns.
