# TASK-009: Update SuperAdmin with subscription_status management

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 8
**Status**: done
**Priority**: medium
**Estimated effort**: M (2-4h)
**Depends-on**: TASK-001
**Assigned-to**: claude-sonnet-4-6

---

## Context

El super-admin gestiona el ciclo de vida de todos los boxes (tenants). Dado que el billing es manual, el super-admin necesita poder cambiar el `subscription_status` de cada box directamente desde el panel. Este task extiende `SuperAdmin.tsx` con: (1) visualización del status como badge, (2) acción para cambiar el status, y (3) métricas básicas de totales por estado.

---

## Scope

- Añadir columna/badge de `subscription_status` en cada card de box.
- Añadir un selector (dropdown) en el card para cambiar el status: `trial` | `active` | `suspended` | `cancelled`.
- Al cambiar el status: `UPDATE boxes SET subscription_status = ? WHERE id = ?` via Supabase.
- Añadir resumen de métricas en el header: "X activos · Y en trial · Z suspendidos".
- El campo `subscription_status` debe incluirse en el SELECT de `fetchBoxes()`.
- Los colores de badge:
  - `active` → verde (`emerald`)
  - `trial` → amarillo (`amber`)
  - `suspended` → rojo (`red`)
  - `cancelled` → gris (`zinc`)

**NOT in scope**: Integración con Stripe. Facturación. Cambios en el routing. Emails de notificación al box owner.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/SuperAdmin.tsx` | MODIFY | Añadir subscription_status a la UI: badge, selector, métricas |

---

## Implementation Notes

### Extensión del tipo BoxRow

```typescript
// En SuperAdmin.tsx, añadir al interface BoxRow:
interface BoxRow {
  // ... campos existentes ...
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled' | null;
}
```

### Actualizar fetchBoxes para incluir subscription_status

```typescript
const { data, error } = await supabase
  .from('boxes')
  .select('id, name, slug, logo_url, login_background_url, created_at, subscription_status')
  .order('created_at', { ascending: false });
```

### Badge de status

```tsx
const StatusBadge = ({ status }: { status: string | null }) => {
  const config: Record<string, { label: string; className: string }> = {
    active:    { label: 'Activo',     className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    trial:     { label: 'Trial',      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    suspended: { label: 'Suspendido', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    cancelled: { label: 'Cancelado',  className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  };
  const c = config[status ?? 'trial'] ?? config['trial'];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.className}`}>
      {c.label}
    </span>
  );
};
```

### Cambiar el status desde el card

```tsx
const handleStatusChange = async (boxId: string, newStatus: string) => {
  try {
    const { error } = await supabase
      .from('boxes')
      .update({ subscription_status: newStatus } as any)
      .eq('id', boxId);
    if (error) throw error;
    // Actualizar estado local sin re-fetch
    setBoxes(prev => prev.map(b =>
      b.id === boxId ? { ...b, subscription_status: newStatus as any } : b
    ));
  } catch (err: any) {
    alert(err.message || 'Error actualizando estado');
  }
};
```

Selector en el card (debajo del badge, visible siempre o solo al hacer hover):
```tsx
<select
  value={box.subscription_status ?? 'trial'}
  onChange={(e) => handleStatusChange(box.id, e.target.value)}
  className="mt-2 w-full text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-white/60 focus:text-white"
>
  <option value="trial">Trial</option>
  <option value="active">Activo</option>
  <option value="suspended">Suspendido</option>
  <option value="cancelled">Cancelado</option>
</select>
```

### Métricas en el header

```tsx
// Calcular desde el array boxes
const metrics = {
  active: boxes.filter(b => b.subscription_status === 'active').length,
  trial: boxes.filter(b => b.subscription_status === 'trial').length,
  suspended: boxes.filter(b => b.subscription_status === 'suspended').length,
};

// Mostrar en el header junto al total de boxes:
<p className="text-sm text-white/40 mt-1">
  {boxes.length} boxes · {metrics.active} activos · {metrics.trial} en trial · {metrics.suspended} suspendidos
</p>
```

### Key Constraints

- El cambio de status actualiza el **estado local** sin hacer re-fetch para una UX más rápida.
- Si el `subscription_status` es `null` (boxes muy viejos sin migración), tratar como `'trial'`.
- El selector de status debe estar habilitado solo para `isRoot` (ya lo garantiza el gate de acceso a `/admin`).
- No usar `alert()` para errores — crear un estado de error inline si es posible, o mantener el `alert()` solo como fallback temporal.

### References en codebase

- `src/pages/SuperAdmin.tsx` — archivo completo a modificar (leer antes)
- `supabase/migrations/20260302_add_subscription_status.sql` (TASK-001) — columna ya creada

---

## Acceptance Criteria

- [ ] Cada card de box muestra el badge de `subscription_status` con el color correcto
- [ ] El selector de status permite cambiar entre `trial`, `active`, `suspended`, `cancelled`
- [ ] El cambio se persiste en Supabase (verificar con SQL: `SELECT subscription_status FROM boxes WHERE id = ?`)
- [ ] Las métricas en el header muestran el conteo correcto por estado
- [ ] Cambiar un box a `suspended` y acceder al subdominio → muestra SuspendedScreen (test de integración)
- [ ] `npx tsc --noEmit` pasa sin errores

---

## Test Specification

Tests manuales:

```
1. Ver badges:
   → Abrir /admin → cada card tiene badge de estado visible

2. Cambiar a 'suspended':
   → En el card de un box, cambiar selector a "Suspendido"
   → Verificar en DB: subscription_status = 'suspended'
   → Abrir localhost?box=<slug> → ver SuspendedScreen

3. Reactivar:
   → En el card del box suspendido, cambiar a "Activo"
   → Abrir localhost?box=<slug> → acceso normal al dashboard

4. Métricas:
   → El header muestra "X activos · Y en trial · Z suspendidos" correctamente
```

---

## Agent Instructions

1. Verificar TASK-001 completado (columna subscription_status en DB)
2. Leer `src/pages/SuperAdmin.tsx` completo
3. Aplicar cambios: incluir campo en SELECT, añadir StatusBadge, añadir selector, añadir métricas
4. Probar los 4 escenarios manuales (incluyendo el test de integración con TASK-005/006)
5. Ejecutar `npx tsc --noEmit`
6. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-03
**Notes**: All scope items implemented in a single file (`src/pages/SuperAdmin.tsx`):
- `SubscriptionStatus` type and `BoxRow.subscription_status` field added
- `STATUS_CONFIG` lookup table + `StatusBadge` component defined at module level
- `fetchBoxes` SELECT extended to include `subscription_status`
- `handleStatusChange` with optimistic update + rollback on error (no `alert()`, inline error banner instead)
- `metrics` object computed before `return` from `boxes` state
- Header subtitle updated to show `X activos · Y en trial · Z suspendidos`
- Badge displayed top-right of card name/slug row; selector always visible below
- `npx tsc --noEmit` passes with zero new errors (pre-existing errors in `Movements.tsx` are unrelated)
**Deviations from spec**: none
