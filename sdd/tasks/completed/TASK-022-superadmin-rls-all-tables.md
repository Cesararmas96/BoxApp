# TASK-022: Add is_super_admin() RLS bypass to all box data tables

**Feature**: root-navigation
**Spec**: `sdd/specs/root-navigation.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: S (<2h)
**Depends-on**: none
**Assigned-to**: claude-sonnet-4-6

---

## Context

`root@test.com` ve 0 resultados en todos los dashboards de boxes porque las tablas de datos
(`wods`, `sessions`, `bookings`, `invoices`, `leads`, etc.) usan la política RLS:

```
USING (box_id = public.current_user_box_id())
```

`current_user_box_id()` retorna el `box_id` del perfil de root en la DB (CrossFit Beta),
no el box que está inspeccionando. La query del frontend filtra por el box visitado pero RLS
aplica el segundo filtro y retorna 0 filas.

La función `is_super_admin()` ya existe (migración `20260219_superadmin_rls.sql`) y se usa
correctamente en `boxes` y `profiles`. Esta tarea extiende el mismo patrón a todas las demás
tablas. Implementa **Module 1** del spec `sdd/specs/root-navigation.spec.md`.

---

## Scope

- Crear migración SQL `supabase/migrations/20260306_superadmin_rls_all_tables.sql`.
- Para cada tabla de datos de box: reemplazar `tenant_isolation_select` con versión que
  incluye `public.is_super_admin() OR box_id = public.current_user_box_id()`.
- Tablas a cubrir: `wods`, `leads`, `expenses`, `invoices`, `plans`, `movements`,
  `personal_records`, `bookings`, `results`, `sessions`, `competitions`, `competition_events`,
  `competition_participants`, `competition_scores`, `competition_judges`, `competition_divisions`,
  `competition_teams`, `competition_heats`, `lane_assignments`, `automation_logs`,
  `functional_feedback`, `audit_logs`, `roles`.
- Cada bloque dentro de `DO $$ BEGIN IF EXISTS ... END IF; END $$;` (idempotente).
- Solo modificar la policy SELECT — INSERT/UPDATE/DELETE quedan sin cambios.

**NOT in scope**: Modificar policies de INSERT/UPDATE/DELETE. Cambiar `boxes` o `profiles`
(ya tienen el bypass). Crear nuevas tablas.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `supabase/migrations/20260306_superadmin_rls_all_tables.sql` | CREATE | Migration con bypass SELECT para todas las tablas |

---

## Implementation Notes

### Pattern to Follow

Usar el mismo patrón de `20260219_superadmin_rls.sql` para `boxes`:

```sql
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wods') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.wods;
  CREATE POLICY "tenant_isolation_select" ON public.wods
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: wods';
END IF;
END $$;
```

Repetir el bloque para cada tabla listada en el scope.

### Key Constraints

- NO tocar policies de INSERT/UPDATE/DELETE — solo SELECT.
- La migration debe ser idempotente (`IF EXISTS` + `DROP POLICY IF EXISTS`).
- Respetar el nombre de policy `"tenant_isolation_select"` — es el que usa la migración base.
- La función `is_super_admin()` es `SECURITY DEFINER` — no necesita redefinirse.

### References in Codebase

- `supabase/migrations/20260219_superadmin_rls.sql` — patrón exacto a replicar
- `supabase/migrations/20260219_rls_multi_tenant_isolation.sql` — lista completa de tablas existentes

---

## Acceptance Criteria

- [ ] Migración creada en `supabase/migrations/20260306_superadmin_rls_all_tables.sql`.
- [ ] Migración aplicada a Supabase (local o remota según entorno).
- [ ] `root@test.com` logueado en `?box=principal` ve datos reales (ej. >0 miembros).
- [ ] `admin@test.com` logueado en `?box=principal` sigue viendo solo datos de su box.
- [ ] Todos los bloques SQL usan `IF EXISTS` para ser idempotentes.

---

## Test Specification

```
Verificación manual post-migración:

1. Aplicar migración:
   npx supabase db push   (o via Supabase MCP apply_migration)

2. Login como root@test.com en http://localhost:5173/dashboard?box=principal
   ✓ Dashboard muestra conteo de miembros > 0
   ✓ Pestaña WODs muestra programación de AreaPrincipal

3. Login como admin@test.com en http://localhost:5173/?box=principal
   ✓ Solo ve datos de AreaPrincipal (no CrossFit Beta ni otros boxes)

4. SQL check (confirmar políticas):
   SELECT tablename, policyname, qual
   FROM pg_policies
   WHERE policyname = 'tenant_isolation_select'
   AND qual LIKE '%is_super_admin%';
   -- Debe listar todas las tablas modificadas
```

---

## Agent Instructions

Cuando retomes esta tarea:

1. **Read the spec** at `sdd/specs/root-navigation.spec.md` para contexto completo.
2. **Check dependencies** — ninguna (esta es la tarea fundacional).
3. **Update status** en `sdd/tasks/.index.json` → `"in-progress"`.
4. **Implement** la migración SQL siguiendo el patrón de `20260219_superadmin_rls.sql`.
5. **Apply migration** via Supabase MCP tool: `mcp__supabase__apply_migration`.
6. **Verify** con SQL query que las políticas tienen `is_super_admin()`.
7. **Move this file** a `sdd/tasks/completed/TASK-022-superadmin-rls-all-tables.md`.
8. **Update index** → `"done"`.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-06
**Notes**: Migración aplicada a Supabase (proyecto uvnqsamswfmrfxedawko). 22 tablas con bypass
confirmadas via SQL check. Tablas sin box_id directo (results, sessions, competition_*,
lane_assignments) usan JOINs con `is_super_admin() OR EXISTS(...)`. automation_logs y
audit_logs mantienen la restricción admin-only para usuarios regulares.
**Deviations from spec**: La spec asumía box_id directo en todas las tablas. En la práctica
`results` usa JOIN via wods, `sessions` tiene IF EXISTS check, y las tablas de competition
sub-entities usan JOIN via competitions. Se respetó el patrón de la migración original.
