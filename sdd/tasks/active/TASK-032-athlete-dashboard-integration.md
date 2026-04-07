# TASK-032: Integrate TodayWod into AthleteDashboard

**Feature**: Athlete Today WOD
**Spec**: `sdd/specs/athlete-today-wod.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-031
**Assigned-to**: unassigned

---

## Context

> FEAT-008 Module 2. Final integration task — embed the TodayWod component into the
> existing AthleteDashboard, replacing the generic "Today's Mission" motivational card.
> The two metric cards (Personal Progress and Attendance) remain unchanged.

---

## Scope

- **Modify** `src/components/AthleteDashboard.tsx`:
  1. Import `TodayWod` from `@/components/TodayWod`
  2. Replace the first `<Card>` block (lines 56-69, the "Today's Mission" card) with `<TodayWod />`
  3. Remove unused `Trophy` import from lucide-react (only used by the removed card)
  4. Keep the "Personal Progress" and "Attendance" cards exactly as they are

**NOT in scope**: Modifying the TodayWod component itself, changing coach/admin dashboards, modifying routing.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/AthleteDashboard.tsx` | MODIFY | Replace "Today's Mission" card with `<TodayWod />` |

---

## Implementation Notes

### Current Code to Replace (lines 56-69)
```tsx
{/* REMOVE THIS ENTIRE CARD */}
<Card className="col-span-full bg-primary/20 border-primary/30 shadow-premium overflow-hidden relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
    <CardHeader className="relative z-10 pt-8 px-8">
        <CardTitle className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tighter text-glow translate-y-0 group-hover:-translate-y-1 transition-transform">
            <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center border-primary/30">
                <Trophy className="h-6 w-6 text-primary group-hover:scale-125 transition-transform" />
            </div>
            Today's Mission
        </CardTitle>
    </CardHeader>
    <CardContent className="relative z-10 px-8 pb-8">
        <p className="text-base font-bold uppercase tracking-wide opacity-80 leading-relaxed max-w-2xl italic">Master the day's challenge. Check the WOD section and dominate your performance logging!</p>
    </CardContent>
</Card>
```

### Replace With
```tsx
<TodayWod />
```

### Import Changes
```diff
- import { Trophy, Activity, Calendar } from 'lucide-react';
+ import { Activity, Calendar } from 'lucide-react';
+ import { TodayWod } from '@/components/TodayWod';
```

### Key Constraints
- Do NOT change the grid layout (`grid gap-8 md:grid-cols-2 lg:grid-cols-3`)
- Do NOT modify the Personal Progress or Attendance cards
- TodayWod already handles `col-span-full` internally
- Verify that the dashboard still renders correctly for athletes

### References in Codebase
- `src/components/AthleteDashboard.tsx` — current file to modify
- `src/components/TodayWod.tsx` — component to import (from TASK-031)
- `src/pages/Dashboard.tsx` — parent page that conditionally renders AthleteDashboard

---

## Acceptance Criteria

- [ ] `AthleteDashboard` imports and renders `<TodayWod />` instead of "Today's Mission" card
- [ ] `Trophy` import removed (no unused imports)
- [ ] Personal Progress card still renders with PRs count
- [ ] Attendance card still renders with attendance percentage
- [ ] `npm run build` passes
- [ ] Coach and Admin dashboards are NOT affected
- [ ] Login as athlete shows TodayWod on the dashboard

---

## Test Specification

Manual verification:
1. Login as `athlete1@iron-box.seed` / `Seed@2024!` at `http://localhost:5173/login?box=iron-box`
2. Dashboard should show TodayWod (or empty state if no WOD today) instead of "Today's Mission"
3. PRs card and Attendance card still visible below
4. Login as `admin1@iron-box.seed` — admin dashboard NOT affected
5. Login as `coach1@wolf-box.seed` — coach dashboard NOT affected

Build verification:
```bash
npm run build  # Must pass with no TS errors
```

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** at `sdd/specs/athlete-today-wod.spec.md`
2. **Check dependencies** — verify TASK-031 is in `sdd/tasks/completed/`
3. **Read** `src/components/AthleteDashboard.tsx` (current state)
4. **Update status** in `sdd/tasks/.index.json` → `"in-progress"`
5. **Edit** `AthleteDashboard.tsx` per scope above
6. **Verify** `npm run build` passes and athlete dashboard renders correctly
7. **Move this file** to `sdd/tasks/completed/`
8. **Update index** → `"done"`
9. **Fill in the Completion Note** below

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: 
**Date**: 
**Notes**: 

**Deviations from spec**: none
