# TASK-001: Add subscription_status to boxes table

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 7
**Status**: done
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: claude-sonnet-4-6

---

## Context

La tabla `boxes` no tiene información sobre el estado de la suscripción del tenant. Este task crea el tipo ENUM y la columna `subscription_status` en Supabase, y migra los boxes existentes a `'active'`. Es la base que permite al SuperAdmin controlar el lifecycle de cada tenant (Module 7 del spec).

---

## Scope

- Crear un tipo ENUM PostgreSQL `subscription_status_type` con valores: `trial`, `active`, `suspended`, `cancelled`.
- Añadir columna `subscription_status subscription_status_type NOT NULL DEFAULT 'trial'` a la tabla `boxes`.
- Actualizar todos los boxes ya existentes a `subscription_status = 'active'`.
- Crear función helper SQL `public.is_tenant_active()` que retorna `true` si el box del usuario actual está activo.
- Sincronizar los TypeScript types: añadir `subscription_status` al Row/Insert/Update de `boxes` en `src/types/supabase.ts`.

**NOT in scope**: Lógica de aplicación de la suspensión (eso es TASK-005 y TASK-006). UI del SuperAdmin (TASK-009).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `supabase/migrations/20260302_add_subscription_status.sql` | CREATE | Migration SQL con ENUM, columna y función helper |
| `src/types/supabase.ts` | MODIFY | Añadir `subscription_status` a tipos de `boxes` |

---

## Implementation Notes

### Migration SQL estructura

```sql
-- 1. Crear ENUM
CREATE TYPE public.subscription_status_type AS ENUM (
  'trial', 'active', 'suspended', 'cancelled'
);

-- 2. Añadir columna (defensiva: solo si no existe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='boxes' AND column_name='subscription_status'
  ) THEN
    ALTER TABLE public.boxes
      ADD COLUMN subscription_status public.subscription_status_type NOT NULL DEFAULT 'trial';
  END IF;
END $$;

-- 3. Migrar boxes existentes a 'active'
UPDATE public.boxes
SET subscription_status = 'active'
WHERE subscription_status = 'trial';

-- 4. Helper function para RLS futuro
CREATE OR REPLACE FUNCTION public.is_tenant_active()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT subscription_status = 'active' OR subscription_status = 'trial'
     FROM public.boxes WHERE id = public.current_user_box_id()),
    false
  )
$$;
```

### TypeScript types update

En `src/types/supabase.ts`, dentro del bloque `boxes: { Row: {...} }`, añadir:
```typescript
subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled'
```
Y en `Insert` y `Update` como campo opcional con el mismo union type + `| null`.

### Key Constraints

- Usar la misma estructura defensiva (`DO $$ BEGIN ... END $$`) que el resto de migrations.
- El DEFAULT es `'trial'` para boxes nuevos — el super-admin los activa manualmente.
- Boxes existentes → `'active'` inmediatamente en la migración.

### References en codebase

- `supabase/migrations/20260219_rls_multi_tenant_isolation.sql` — patrón defensivo a seguir
- `supabase/migrations/20260219_superadmin_rls.sql` — función `public.current_user_box_id()`
- `src/types/supabase.ts:97` — definición actual de `boxes`

---

## Acceptance Criteria

- [ ] La migración corre sin errores: `npx supabase db push` (o aplicar en Supabase Dashboard)
- [ ] La columna `subscription_status` existe en `public.boxes` con DEFAULT `'trial'`
- [ ] Todos los boxes existentes tienen `subscription_status = 'active'`
- [ ] `SELECT public.is_tenant_active()` retorna `true` para un usuario autenticado de un box activo
- [ ] `src/types/supabase.ts` tiene el campo `subscription_status` en Row/Insert/Update de `boxes`
- [ ] El proyecto TypeScript compila sin errores: `npx tsc --noEmit`

---

## Test Specification

Tests manuales vía Supabase SQL Editor:

```sql
-- Verificar que la columna existe con valores correctos
SELECT id, name, slug, subscription_status FROM public.boxes;
-- Esperado: todos los rows tienen 'active'

-- Verificar función helper (autenticado como un usuario de box)
SELECT public.is_tenant_active();
-- Esperado: true

-- Verificar que nuevos boxes insertan con DEFAULT 'trial'
INSERT INTO public.boxes (name, slug) VALUES ('Test Box', 'test-box-temp');
SELECT subscription_status FROM public.boxes WHERE slug = 'test-box-temp';
-- Esperado: 'trial'
ROLLBACK; -- o DELETE WHERE slug = 'test-box-temp'
```

---

## Agent Instructions

1. Leer el spec en `sdd/specs/multi-tenant-platform.spec.md`
2. No hay dependencias — puede ejecutarse inmediatamente
3. Crear el archivo de migración SQL
4. Editar `src/types/supabase.ts` para añadir el campo
5. Aplicar la migración y verificar con las queries de test
6. Mover a `tasks/completed/` y actualizar el índice

---

## Completion Note

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-03
**Notes**: Migration SQL creada con ENUM defensivo, columna con DEFAULT 'trial', UPDATE de existentes a 'active', y función `is_tenant_active()`. Tipos TypeScript actualizados en `src/types/supabase.ts` para Row/Insert/Update. Los 3 errores de TypeScript reportados son pre-existentes en `Movements.tsx` (sin relación con este task).
**Deviations from spec**: ninguna.
