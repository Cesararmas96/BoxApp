# TASK-035: Implement seed-movement-media script

**Feature**: Movement Media Library (FEAT-009)
**Spec**: `sdd/specs/movement-media-library.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: L (4-8h)
**Depends-on**: TASK-033, TASK-034
**Assigned-to**: unassigned

---

## Context

Core task of FEAT-009. Maps to **Module 3** and **Module 5** of the spec. This script connects to ExerciseDB (RapidAPI), downloads GIF animations for each movement in the DB, uploads them to Supabase Storage, and updates the `movements` table with the new image URLs.

---

## Scope

- Implement `scripts/seed-movement-media.ts` with the following capabilities:
  1. Read all global movements (box_id IS NULL) from DB
  2. For each movement without a custom image_url:
     - Normalize name, check manual mapping (TASK-034)
     - Search ExerciseDB via fuzzy search endpoint
     - Download GIF (480p preferred)
     - Upload to Supabase Storage bucket `movement-media`
     - Update `image_url` in DB with storage public URL
  3. Generate `scripts/seed-report.json` with matching statistics
- Support `--dry-run` flag (match only, no download/upload)
- Support `--force` flag (re-download even if image_url already set)
- Implement rate limiting (100ms delay between API calls, retry with exponential backoff)

**NOT in scope**: UI changes, modifying `movementImages.ts`, creating the storage bucket (TASK-033).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `scripts/seed-movement-media.ts` | CREATE | Main seed script |
| `scripts/seed-report.json` | CREATE (output) | Generated matching report |
| `package.json` | MODIFY | Add script: `"seed:media": "tsx scripts/seed-movement-media.ts"` |

---

## Implementation Notes

### Architecture
```typescript
// Main flow
async function main() {
  const args = parseArgs(process.argv);  // --dry-run, --force
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // 1. Load movements from DB
  const movements = await loadGlobalMovements(supabase);
  
  // 2. Load manual mapping
  const mapping = await loadMapping('./scripts/movement-name-mapping.json');
  
  // 3. Process each movement
  const results: MatchResult[] = [];
  for (const mov of movements) {
    const result = await processMovement(mov, mapping, supabase, args);
    results.push(result);
    await delay(100); // rate limit
  }
  
  // 4. Generate report
  await writeReport(results, './scripts/seed-report.json');
  printSummary(results);
}
```

### ExerciseDB API Integration
```typescript
const EXERCISEDB_BASE = 'https://exercisedb-api.vercel.app/api/v1';
// OR RapidAPI:
// const EXERCISEDB_BASE = 'https://edb-with-gifs-and-images-by-ascendapi.p.rapidapi.com/api/v1';

// Fuzzy search
const searchUrl = `${EXERCISEDB_BASE}/exercises/search?search=${encodeURIComponent(name)}&threshold=0.4`;

// Headers for RapidAPI
const headers = {
  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
  'X-RapidAPI-Host': 'exercisedb-api.vercel.app'
};
```

### Environment Variables Required
```bash
VITE_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # NOT the anon key
RAPIDAPI_KEY=...                 # From rapidapi.com
```

### Key Constraints
- NEVER use anon key for storage uploads — must use service_role key
- Always download GIFs, never hotlink (URLs rotate weekly)
- Skip movements with box_id != NULL (custom per-box movements)
- Skip movements that already have a non-default image_url (unless --force)
- Handle network errors gracefully — log and skip, don't abort entire seed

### References in Codebase
- `src/lib/movementImages.ts` — `slugify()` function for name normalization
- `src/types/supabase.ts` lines 1190-1225 — movements table type
- `scripts/movement-name-mapping.json` (TASK-034) — manual overrides

---

## Acceptance Criteria

- [ ] Script runs: `npx tsx scripts/seed-movement-media.ts`
- [ ] `--dry-run` mode works: reports matches without downloading
- [ ] `--force` mode works: re-downloads even for populated movements
- [ ] Rate limiting: max 10 requests/second to ExerciseDB
- [ ] GIFs uploaded to Supabase Storage bucket `movement-media`
- [ ] `movements.image_url` updated with storage public URL
- [ ] `seed-report.json` generated with: total, matched (exact/fuzzy/manual), unmatched, errors
- [ ] Movements with box_id != NULL are skipped
- [ ] Movements with existing custom image_url are skipped (unless --force)
- [ ] Network errors logged and skipped, not fatal
- [ ] Console output shows progress: `[42/150] ✓ Back Squat → matched (fuzzy)`

---

## Test Specification

```typescript
// scripts/__tests__/seed-movement-media.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeMovementName, buildSearchTerm, parseArgs } from '../seed-movement-media';

describe('normalizeMovementName', () => {
  it('lowercases and trims', () => {
    expect(normalizeMovementName('  Back Squat  ')).toBe('back squat');
  });

  it('replaces & with and', () => {
    expect(normalizeMovementName('Clean & Jerk')).toBe('clean and jerk');
  });
});

describe('buildSearchTerm', () => {
  it('uses manual mapping when available', () => {
    const mapping = { 'GHD Sit-Up': 'ghd sit up' };
    expect(buildSearchTerm('GHD Sit-Up', mapping)).toBe('ghd sit up');
  });

  it('falls back to normalized name', () => {
    expect(buildSearchTerm('Deadlift', {})).toBe('deadlift');
  });
});

describe('parseArgs', () => {
  it('parses --dry-run flag', () => {
    const args = parseArgs(['node', 'script.ts', '--dry-run']);
    expect(args.dryRun).toBe(true);
  });

  it('parses --force flag', () => {
    const args = parseArgs(['node', 'script.ts', '--force']);
    expect(args.force).toBe(true);
  });
});
```

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** at `sdd/specs/movement-media-library.spec.md`
2. **Verify dependencies**: TASK-033 (bucket) and TASK-034 (mapping) must be completed
3. **Check** `SUPABASE_SERVICE_ROLE_KEY` and `RAPIDAPI_KEY` are available in `.env`
4. **Update status** in `tasks/.index.json` → `"in-progress"`
5. **Implement** the seed script following the architecture above
6. **Test** with `--dry-run` first to verify matching quality
7. **Run** full seed and verify GIFs appear in Storage
8. **Move this file** to `tasks/completed/TASK-035-seed-movement-media.md`
9. **Update index** → `"done"`

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: claude-opus-4-6
**Date**: 2026-04-07
**Notes**: Implemented seed script as `.mjs` (not `.ts`) to match existing project patterns (other scripts use `.mjs`). Uses ExerciseDB v3 RapidAPI endpoint (`exercisedb.p.rapidapi.com/exercises/name/`). Includes --dry-run, --force, --limit flags. Generates seed-report.json with full statistics. Added npm scripts `seed:media` and `seed:media:dry`. Updated `.env.example` with new env vars.

**Deviations from spec**: Used `.mjs` extension instead of `.ts` to avoid tsx dependency and match existing script patterns. ExerciseDB API endpoint uses `/exercises/name/` (v3) instead of `/exercises/search` (v1) as the v1 self-hosted version is offline.
