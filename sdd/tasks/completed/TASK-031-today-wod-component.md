# TASK-031: Implement TodayWod component

**Feature**: Athlete Today WOD
**Spec**: `sdd/specs/athlete-today-wod.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: L (4-8h)
**Depends-on**: TASK-030
**Assigned-to**: unassigned

---

## Context

> FEAT-008 Module 1. This is the core deliverable — a new React component that shows
> today's WOD directly on the athlete dashboard. It replaces the generic "Today's Mission"
> motivational card with real workout content including structured blocks, visual movement
> images, track selection, and collapsible scaling options.

---

## Scope

- **Create** `src/components/TodayWod.tsx` — the main component
- Implement data fetching:
  - Query `wods` table filtered by `date = today` and `box_id = currentBox.id`
  - Query `movements` table for the box to resolve images and demo URLs
  - Both queries in parallel via `Promise.all`
- Implement **Track Selector**: horizontal pills, only visible when >1 track has a WOD today
- Implement **WOD Structure Display**: render `wod.structure[]` (SessionBlock array)
  - Each block shows title (warmup, strength, conditioning, wod, accessory, cooldown)
  - Each BlockItem shows:
    - Movement image via `resolveMovementImage(name, customUrl, category)` — lazy loaded
    - Movement name + category badge (color per category)
    - Reps/weight in a pill on the right
    - Clickable if movement has `demo_url` (opens in new tab)
- Implement **Stimulus section**: show `wod.stimulus` text
- Implement **Scaling Collapsible**: toggle to show/hide 4 scaling tiers
  - Beginner (green), Intermediate (orange), Advanced (blue), Injured (amber/red)
  - Follow the color pattern from `Schedule.tsx:730-748`
- Implement **Empty State**: rest day message with link to `/schedule`
- Implement **Fallback**: if `structure` is empty but `metcon` exists, render as pre-formatted text
- **Timezone safety**: use `new Date().toLocaleDateString('en-CA')` for YYYY-MM-DD

**NOT in scope**: result logging, WOD editing, notifications, coach/admin views.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/TodayWod.tsx` | CREATE | Main component |

---

## Implementation Notes

### Pattern to Follow — Data Fetching
```typescript
// From Schedule.tsx:107-153 and Wods.tsx:117-177
useEffect(() => {
    if (currentBox?.id) fetchTodayData();
}, [currentBox]);

const fetchTodayData = async () => {
    setLoading(true);
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone
    
    const [wodsResult, movementsResult] = await Promise.all([
        supabase.from('wods').select('*')
            .eq('box_id', currentBox!.id)
            .eq('date', today),
        supabase.from('movements').select('*')
            .eq('box_id', currentBox!.id)
    ]);
    // ...process results
    setLoading(false);
};
```

### Pattern to Follow — Block Rendering (from Schedule.tsx:677-700)
```tsx
{wod.structure.map((block: any) => (
    <div key={block.id} className="p-5 rounded-2xl bg-muted/50 border border-border">
        <p className="text-[10px] font-black uppercase text-primary mb-3 italic tracking-[0.2em]">
            {block.title}
        </p>
        <div className="space-y-3">
            {block.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start gap-3">
                    {/* MovementImage + name on left, reps/weight pill on right */}
                </div>
            ))}
        </div>
    </div>
))}
```

### Pattern to Follow — Scaling Display (from Schedule.tsx:726-748)
```tsx
// Beginner → green-500, Intermediate → orange-500, Advanced → blue-500, Injured → red-500
<div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
    <p className="text-[9px] font-black text-green-500 uppercase mb-1">Beginner</p>
    <p className="text-[10px] font-bold text-foreground/70 italic">{scaling_beginner}</p>
</div>
```

### Movement Image Resolution
```typescript
import { resolveMovementImage } from '@/lib/movementImages';

// For each BlockItem, find matching movement from fetched movements array
const movement = movements.find(m => 
    m.name.toLowerCase() === item.movementName.toLowerCase()
);
const imageUrl = resolveMovementImage(
    item.movementName,
    movement?.image_url || null,
    movement?.category || 'Other'
);
```

### Key Constraints
- Component must be `col-span-full` in the dashboard grid
- Use `loading="lazy"` on all `<img>` tags for performance
- Movement images should be small thumbnails (40x40 or 48x48 rounded)
- Max height with scroll: `max-h-[600px] overflow-y-auto` on structure container
- Use `useLanguage()` hook for all text, reference `athlete.*` i18n keys from TASK-030
- Mobile-first: stack everything vertically on mobile

### References in Codebase
- `src/pages/Schedule.tsx:645-764` — WOD detail dialog (rendering pattern + scaling)
- `src/pages/Wods.tsx:58-73` — WOD interface definition
- `src/components/WODDesigner.tsx` — SessionBlock, BlockItem, LessonBlock interfaces
- `src/lib/movementImages.ts` — resolveMovementImage(), image resolution pipeline
- `src/components/AthleteDashboard.tsx` — current dashboard (to match styling)

---

## Acceptance Criteria

- [ ] `src/components/TodayWod.tsx` created and exports `TodayWod` component
- [ ] Fetches today's WODs and box movements on mount
- [ ] Renders session blocks with movement images, names, reps/weight
- [ ] Track selector appears when >1 track has WOD for today
- [ ] Stimulus section visible when WOD has stimulus
- [ ] Scaling collapsible works (toggle show/hide)
- [ ] Empty state renders on days without WOD
- [ ] Fallback renders metcon text when no structure exists
- [ ] All text uses i18n keys from TASK-030
- [ ] Images use `loading="lazy"`
- [ ] Responsive layout (mobile stacked, desktop wider)
- [ ] `npm run build` passes with no TypeScript errors

---

## Test Specification

Manual verification:
1. Login as `athlete1@iron-box.seed` / `Seed@2024!` at `http://localhost:5173/login?box=iron-box`
2. Ensure a WOD exists for today's date in the Iron Box
3. Verify the TodayWod component renders correctly (import it in a test page or integrate via TASK-032)
4. Check movement images load (Pexels for common movements, SVG fallback for others)
5. Toggle scaling section — verify expand/collapse
6. Remove today's WOD — verify empty state
7. Test a WOD with no `structure` but with `metcon` text — verify fallback

Build verification:
```bash
npm run build  # Must pass with no TS errors
```

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** at `sdd/specs/athlete-today-wod.spec.md` for full context
2. **Check dependencies** — verify TASK-030 is in `sdd/tasks/completed/`
3. **Read reference files**:
   - `src/pages/Schedule.tsx` lines 645-764 (WOD rendering + scaling)
   - `src/components/WODDesigner.tsx` (SessionBlock/BlockItem interfaces)
   - `src/lib/movementImages.ts` (resolveMovementImage function)
   - `src/components/AthleteDashboard.tsx` (styling reference)
4. **Update status** in `sdd/tasks/.index.json` → `"in-progress"`
5. **Implement** `src/components/TodayWod.tsx`
6. **Verify** `npm run build` passes
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
