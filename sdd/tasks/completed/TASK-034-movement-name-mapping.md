# TASK-034: Create movement name mapping JSON

**Feature**: Movement Media Library (FEAT-009)
**Spec**: `sdd/specs/movement-media-library.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: M (2-4h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

Maps to **Module 2** of the spec. ExerciseDB uses different naming conventions than our `movements` table (e.g., "Clean & Jerk" in our DB vs "barbell clean and jerk" in ExerciseDB). This JSON provides manual overrides for movements that won't resolve via fuzzy search.

---

## Scope

- Read all movement names from `movements_master.json` and the DB migration `20260215_full_crossfit_movements.sql`
- Research ExerciseDB naming patterns for CrossFit movements
- Create a mapping JSON with:
  - `our_name` → `exercisedb_search_term` for movements that need manual mapping
  - Aliases for common name variations (C2B, T2B, HSPU, etc.)
- Document which movements are expected to NOT have a match in ExerciseDB

**NOT in scope**: Seed script, API calls, downloading media.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `scripts/movement-name-mapping.json` | CREATE | Manual mapping overrides |
| `scripts/movement-unmatchable.json` | CREATE | List of movements unlikely to match (for reporting) |

---

## Implementation Notes

### Expected Structure
```json
{
  "_comment": "Manual overrides: our DB name → ExerciseDB search term",
  "mapping": {
    "Clean & Jerk": "barbell clean and jerk",
    "GHD Sit-Up": "ghd sit up",
    "C2B Pull-Up": "chest to bar pull up",
    "T2B": "toes to bar",
    "HSPU": "handstand push up",
    "Assault Bike": "stationary bike",
    "Echo Bike": "stationary bike",
    "Ski Erg": "ski machine",
    "Devil Press": "dumbbell burpee"
  },
  "aliases": {
    "Power Clean": ["barbell power clean", "power clean"],
    "Snatch": ["barbell snatch", "snatch"]
  }
}
```

### Key Constraints
- Names must match EXACTLY what's in the `movements` table (case-sensitive before normalization)
- For ambiguous matches, prefer barbell variant (CrossFit default)
- Include a `_comment` field explaining the mapping purpose

### References in Codebase
- `src/lib/movementImages.ts` — `MOVEMENT_ICON_MAP` has ~100 name aliases already
- `movements_master.json` — 130+ movement names
- `supabase/migrations/20260215_full_crossfit_movements.sql` — definitive list

---

## Acceptance Criteria

- [ ] `scripts/movement-name-mapping.json` is valid JSON
- [ ] All keys in the mapping exist in the movements DB (cross-referenced)
- [ ] At least 20 manual overrides for CrossFit-specific movements
- [ ] `movement-unmatchable.json` lists movements that likely have no ExerciseDB equivalent
- [ ] No duplicate keys

---

## Test Specification

```typescript
// Validate mapping JSON
import mapping from './movement-name-mapping.json';
import movements from '../movements_master.json';

// All mapping keys should exist in our movement list
const movementNames = movements.map(m => m.name);
for (const key of Object.keys(mapping.mapping)) {
  expect(movementNames).toContain(key);
}
```

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** at the path listed above for full context
2. **Read** `movements_master.json` and `20260215_full_crossfit_movements.sql` for the full movement list
3. **Read** `src/lib/movementImages.ts` for existing name aliases
4. **Update status** in `tasks/.index.json` → `"in-progress"`
5. **Research** ExerciseDB naming patterns to identify mismatches
6. **Create** the mapping JSON files
7. **Move this file** to `tasks/completed/TASK-034-movement-name-mapping.md`
8. **Update index** → `"done"`

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: claude-opus-4-6
**Date**: 2026-04-07
**Notes**: Created 132-entry mapping covering all movements in the DB (SQL migration + master JSON). Also created unmatchable list with 25 movements unlikely to have good ExerciseDB matches. Validated: all mapping keys exist in the movement list, zero duplicates, valid JSON.

**Deviations from spec**: Mapped ALL 132 movements (not just the ~20 manual overrides mentioned in the spec) to maximize seed success rate. The unmatchable list has 25 entries (more than the estimated ~20).
