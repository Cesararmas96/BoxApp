# TASK-011: Add trial_ends_at column and admin RLS policy to boxes table

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

Este es el prerequisito de todos los demás módulos del panel administrativo. Sin la columna
`trial_ends_at` en la tabla `boxes`, el `SubscriptionBanner` y la tab "Suscripción" en Settings
no pueden calcular ni mostrar el fin del período de prueba. Sin la RLS policy correcta, el admin
no puede pausar su propio box desde la UI.

Implementa el **Module 1** de la spec (sección 3).

---

## Scope

- Crear migration SQL que agrega `trial_ends_at TIMESTAMPTZ` a la tabla `boxes`.
- Rellenar `trial_ends_at` para todos los boxes existentes con `created_at + INTERVAL '30 days'`.
- Agregar RLS policy en `boxes` que permite al admin hacer `UPDATE subscription_status = 'suspended'`
  únicamente en su propio box (verificado por `current_user_box_id()`).
- Actualizar manualmente `src/types/supabase.ts` para agregar `trial_ends_at: string | null` al tipo `boxes.Row`.

**NOT in scope**: Interfaz de usuario, lógica de frontend, otras tablas.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `supabase/migrations/20260303_admin_panel.sql` | CREATE | Migration: columna + backfill + RLS policy |
| `src/types/supabase.ts` | MODIFY | Agregar `trial_ends_at: string \| null` en `boxes.Row` |

---

## Implementation Notes

### Migration SQL completa

```sql
-- 1. Agregar columna trial_ends_at
ALTER TABLE boxes
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Backfill: boxes existentes = created_at + 30 días
UPDATE boxes
SET trial_ends_at = created_at + INTERVAL '30 days'
WHERE trial_ends_at IS NULL;

-- 3. RLS policy: admin puede suspender su propio box
-- IMPORTANTE: Solo permite cambiar a 'suspended'.
-- Reactivar ('active', 'trial') sigue siendo potestad del superadmin.
CREATE POLICY "admin_can_suspend_own_box"
  ON boxes
  FOR UPDATE
  TO authenticated
  USING (id = current_user_box_id())
  WITH CHECK (
    id = current_user_box_id()
    AND subscription_status = 'suspended'
  );

-- Nota: current_user_box_id() ya existe como función SECURITY DEFINER
-- definida en la migración 20260219_rls_multi_tenant_isolation.sql
```

### Precaución sobre RLS existente

Antes de crear la policy, verificar si ya existe una policy `FOR UPDATE` en `boxes` para
`authenticated`. Si existe, puede necesitar ser modificada en lugar de crear una nueva.
Revisar `supabase/migrations/20260219_rls_multi_tenant_isolation.sql` y
`supabase/migrations/20260219_superadmin_rls.sql`.

### Actualización del tipo TypeScript

En `src/types/supabase.ts`, dentro de `Database['public']['Tables']['boxes']['Row']`:

```typescript
// Agregar esta línea junto a las demás columnas:
trial_ends_at: string | null
```

Y en `Database['public']['Tables']['boxes']['Insert']` y `['Update']` también:
```typescript
trial_ends_at?: string | null
```

### Key Constraints

- Usar `ADD COLUMN IF NOT EXISTS` para que la migration sea idempotente.
- El `WITH CHECK` de la policy PostgreSQL es lo que restringe el valor permitido en el UPDATE.
- No usar `SECURITY DEFINER` en la policy (es innecesario y ampliaría permisos).

### References in Codebase

- `supabase/migrations/20260219_rls_multi_tenant_isolation.sql` — ver definición de `current_user_box_id()` y políticas existentes en `boxes`
- `supabase/migrations/20260302_add_subscription_status.sql` — patrón de migration seguido en este proyecto
- `src/types/supabase.ts` — estructura del tipo `boxes.Row` a extender

---

## Acceptance Criteria

- [ ] La migration aplica sin errores en Supabase (`supabase db push` o via dashboard).
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='boxes' AND column_name='trial_ends_at'` retorna 1 fila.
- [ ] `SELECT COUNT(*) FROM boxes WHERE trial_ends_at IS NULL` retorna 0.
- [ ] Un usuario admin puede ejecutar `UPDATE boxes SET subscription_status='suspended' WHERE id='<su_box>'` sin error de RLS.
- [ ] Un usuario admin NO puede ejecutar `UPDATE boxes SET subscription_status='active' WHERE id='<su_box>'` (debe fallar por RLS).
- [ ] `src/types/supabase.ts` tiene `trial_ends_at: string | null` en `boxes.Row`, `Insert` y `Update`.
- [ ] El tipo compila sin errores: `npx tsc --noEmit`.

---

## Test Specification

```sql
-- Ejecutar estas queries en Supabase SQL Editor para verificar

-- 1. Columna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'boxes' AND column_name = 'trial_ends_at';
-- Esperado: 1 fila, data_type = 'timestamp with time zone', is_nullable = 'YES'

-- 2. Backfill completo
SELECT COUNT(*) FROM boxes WHERE trial_ends_at IS NULL;
-- Esperado: 0

-- 3. Valor de backfill correcto (muestra de verificación)
SELECT id, created_at, trial_ends_at,
       (trial_ends_at - created_at) AS diff
FROM boxes LIMIT 5;
-- Esperado: diff ≈ '30 days' para todos

-- 4. Policy existe
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'boxes' AND policyname = 'admin_can_suspend_own_box';
-- Esperado: 1 fila
```

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** at `sdd/specs/panel-administrativo.spec.md` — Module 1.
2. **Check dependencies** — ninguna; este es el primer task.
3. **Update status** en `sdd/tasks/.index.json` → `"in-progress"` con tu session ID.
4. **Revisar migrations existentes** antes de crear la policy (evitar conflictos con RLS ya definido).
5. **Aplicar la migration** via Supabase MCP (`apply_migration`) o `supabase db push`.
6. **Actualizar** `src/types/supabase.ts` manualmente.
7. **Verificar** todos los acceptance criteria con las SQL queries del test spec.
8. **Mover** este archivo a `sdd/tasks/completed/`.
9. **Actualizar index** → `"done"`.

---

## Completion Note

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-03
**Notes**: Migration applied via Supabase MCP. Column `trial_ends_at TIMESTAMPTZ` added to `boxes`
and backfilled for all existing rows (0 nulls remaining). The UPDATE RLS policy was refined: box
admins can update their own box freely, but `subscription_status` can only be set to `'suspended'`
(superadmin retains full UPDATE access). There was already a pre-existing `"Allow admins to update
their box"` policy on the table — the new migration correctly replaces `tenant_isolation_update`
with the refined version. TypeScript type `boxes.Row/Insert/Update` updated with `trial_ends_at`.
Pre-existing TS errors in `Movements.tsx` are unrelated to this task.
**Deviations from spec**: The spec mentioned `supabase.auth.reauthenticate()` for slug change —
that belongs to TASK-019, not this migration task.
