# TASK-036: Update movementImages.ts with Storage GIF priority

**Feature**: Movement Media Library (FEAT-009)
**Spec**: `sdd/specs/movement-media-library.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-033
**Assigned-to**: unassigned

---

## Context

Maps to **Module 4** of the spec. After the seed script populates `image_url` with Supabase Storage GIF URLs, the runtime image resolution in `movementImages.ts` needs to recognize these as higher priority than Pexels photos or SVG icons.

Currently `resolveMovementImage()` checks:
1. Custom uploaded image (`customImageUrl` param)
2. Pexels realistic photo (hardcoded map)
3. SVG local icon
4. Category default

After this task, the chain becomes:
1. Custom uploaded image (`customImageUrl` param)
2. **Supabase Storage GIF** (if `image_url` points to storage) ← NEW
3. Pexels realistic photo
4. SVG local icon
5. Category default

---

## Scope

- Modify `resolveMovementImage()` to detect Supabase Storage URLs and treat them as priority 2
- Add a helper function `isStorageGif(url: string): boolean` to detect storage URLs
- The detection is simple: check if the URL contains the Supabase storage domain and `movement-media` bucket

**NOT in scope**: Seed script, bucket creation, UI changes.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/lib/movementImages.ts` | MODIFY | Add storage GIF detection in resolution chain |

---

## Implementation Notes

### Pattern
```typescript
/**
 * Check if a URL points to our Supabase Storage movement-media bucket.
 */
function isStorageGif(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/movement-media/');
}

/**
 * Updated priority chain:
 * 1. Custom upload (non-storage custom image)
 * 2. Supabase Storage GIF (seeded from ExerciseDB)
 * 3. Pexels realistic photo
 * 4. SVG local icon
 * 5. Category default
 */
export function resolveMovementImage(
  movementName: string,
  customImageUrl: string | null | undefined,
  category: Category
): string {
  // 1. Custom uploaded image (but NOT if it's a storage GIF — that's level 2)
  if (customImageUrl && customImageUrl.trim() !== '' && !isStorageGif(customImageUrl)) {
    return customImageUrl;
  }

  // 2. Supabase Storage GIF (seeded from ExerciseDB)
  if (isStorageGif(customImageUrl)) {
    return customImageUrl!;
  }

  // 3. Pexels realistic photo
  const key = movementName.toLowerCase().trim();
  const realistic = MOVEMENT_REALISTIC_IMAGES[key];
  if (realistic) return realistic;

  // 4. SVG local icon
  const movementPath = getMovementImagePath(movementName);
  if (movementPath) return movementPath;

  // 5. Category default
  return getDefaultCategoryImage(category);
}
```

### Key Constraints
- The `customImageUrl` parameter comes from `movements.image_url` in the DB
- After the seed (TASK-035), this field will contain Supabase Storage URLs for seeded movements
- Custom uploads by admins (non-storage URLs) must still take highest priority
- Zero breaking changes — if no storage GIF exists, behavior is identical to current

### References in Codebase
- `src/lib/movementImages.ts` — current implementation (the file being modified)
- `src/pages/Movements.tsx` — calls `resolveMovementImage()` for display

---

## Acceptance Criteria

- [ ] `resolveMovementImage()` returns storage GIF URL when `image_url` points to storage
- [ ] Custom uploads (non-storage URLs) still take highest priority
- [ ] Movements without storage GIF fall through to Pexels/SVG/default as before
- [ ] `isStorageGif()` exported for potential use in other components
- [ ] No breaking changes to existing callers
- [ ] `npx tsc --noEmit` passes

---

## Test Specification

```typescript
import { describe, it, expect } from 'vitest';
import { resolveMovementImage } from '../src/lib/movementImages';

describe('resolveMovementImage with storage GIFs', () => {
  const STORAGE_URL = 'https://xyz.supabase.co/storage/v1/object/public/movement-media/back-squat.gif';
  const CUSTOM_URL = 'https://example.com/my-custom-image.jpg';

  it('returns storage GIF when image_url is a storage URL', () => {
    const result = resolveMovementImage('Back Squat', STORAGE_URL, 'Weightlifting');
    expect(result).toBe(STORAGE_URL);
  });

  it('custom upload overrides storage GIF', () => {
    const result = resolveMovementImage('Back Squat', CUSTOM_URL, 'Weightlifting');
    expect(result).toBe(CUSTOM_URL);
  });

  it('falls back to Pexels when no custom or storage URL', () => {
    const result = resolveMovementImage('Back Squat', null, 'Weightlifting');
    expect(result).toContain('pexels.com');
  });

  it('falls back to SVG when no Pexels match', () => {
    const result = resolveMovementImage('Muscle Snatch', null, 'Weightlifting');
    expect(result).toBe('/movements/snatch.svg');
  });
});
```

---

## Agent Instructions

When you pick up this task:

1. **Read** `src/lib/movementImages.ts` carefully — the full current implementation
2. **Verify** TASK-033 is done (bucket exists so we know the URL pattern)
3. **Update status** in `tasks/.index.json` → `"in-progress"`
4. **Implement** the minimal change to `resolveMovementImage()`
5. **Run** `npx tsc --noEmit` to verify no type errors
6. **Move this file** to `tasks/completed/TASK-036-image-resolution-update.md`
7. **Update index** → `"done"`

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: claude-opus-4-6
**Date**: 2026-04-07
**Notes**: Added `isStorageGif()` helper and updated `resolveMovementImage()` priority chain. Custom non-storage uploads still take highest priority. Storage GIFs (seeded from ExerciseDB) are priority 2. Pexels, SVG, and category defaults remain as fallbacks. Zero type errors. Backward compatible — no changes needed in consumer files (Movements.tsx, TodayWod.tsx).

**Deviations from spec**: The implementation in the task file suggested checking `!isStorageGif(customImageUrl)` for custom uploads, which is exactly what was implemented. Minor simplification: extracted `url` variable to avoid repeated null checks.
