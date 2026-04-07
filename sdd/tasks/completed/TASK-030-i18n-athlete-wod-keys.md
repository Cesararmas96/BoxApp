# TASK-030: Add i18n translation keys for Athlete Today WOD

**Feature**: Athlete Today WOD
**Spec**: `sdd/specs/athlete-today-wod.spec.md`
**Status**: pending
**Priority**: medium
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

> FEAT-008 Module 3. Before building the TodayWod component, we need the i18n keys
> so the component can reference them from day one. This task has no dependencies
> and can run in parallel with other prep work.

---

## Scope

- Add new i18n keys under the `athlete` namespace in both `en.json` and `es.json`
- Reuse existing keys where they already exist (e.g., `wods.block_warmup`, `wods.block_strength`)
- Only add keys that don't already exist

**Keys to add:**
```
athlete.today_wod          → "Today's Programming" / "Programacion del Dia"
athlete.rest_day           → "Rest Day — No programming scheduled" / "Dia de Descanso — Sin programacion"
athlete.view_schedule      → "View Weekly Schedule" / "Ver Horario Semanal"
athlete.scaling_levels     → "Scaling Options" / "Opciones de Escalado"
athlete.show_scaling       → "Show Scaling" / "Ver Escalado"
athlete.hide_scaling       → "Hide Scaling" / "Ocultar Escalado"
athlete.target_stimulus    → "Target Stimulus" / "Estimulo Objetivo"
athlete.watch_demo         → "Watch Demo" / "Ver Demo"
athlete.beginner           → "Beginner" / "Principiante"
athlete.intermediate       → "Intermediate" / "Intermedio"
athlete.advanced           → "Advanced" / "Avanzado"
athlete.injured            → "Injured / Modified" / "Lesionado / Modificado"
athlete.select_track       → "Select Track" / "Seleccionar Track"
athlete.rest_day_message   → "Take time to recover. Check the schedule for upcoming sessions." / "Toma tiempo para recuperarte. Revisa el horario para las proximas sesiones."
```

**NOT in scope**: Component implementation, any code changes outside locale files.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/locales/en.json` | MODIFY | Add `athlete.*` keys |
| `src/locales/es.json` | MODIFY | Add `athlete.*` keys (Spanish translations) |

---

## Implementation Notes

### Pattern to Follow
Check the existing i18n structure. Keys are organized by namespace (e.g., `wods.*`, `dashboard.*`, `schedule.*`). Add a new `athlete` section near the existing `dashboard` keys.

### Key Constraints
- Do NOT modify existing keys
- Only add new keys under the `athlete` namespace
- Spanish translations should be natural, not literal translations
- Verify JSON is valid after edits

### References in Codebase
- `src/locales/en.json` — existing i18n keys structure
- `src/locales/es.json` — existing Spanish translations

---

## Acceptance Criteria

- [ ] All 14 `athlete.*` keys present in `en.json`
- [ ] All 14 `athlete.*` keys present in `es.json` with correct Spanish
- [ ] JSON files are valid (no syntax errors)
- [ ] `npm run build` passes
- [ ] No existing keys were modified

---

## Test Specification

Manual verification:
1. Open `en.json` and `es.json`, search for `"athlete.`
2. Verify all 14 keys exist in both files
3. Run `npm run build` — no errors

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** at `sdd/specs/athlete-today-wod.spec.md` for full context
2. **Check dependencies** — none for this task
3. **Update status** in `sdd/tasks/.index.json` → `"in-progress"`
4. **Read** `src/locales/en.json` and `src/locales/es.json` to find insertion point
5. **Add** the `athlete.*` keys to both files
6. **Verify** JSON validity and `npm run build`
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
