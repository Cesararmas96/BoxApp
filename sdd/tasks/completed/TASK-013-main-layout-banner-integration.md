# TASK-013: Integrate SubscriptionBanner into MainLayout header

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-011, TASK-012
**Assigned-to**: unassigned

---

## Context

El `SubscriptionBanner` (TASK-012) debe ser visible en todo momento para el admin, sin importar
en qué ruta esté. El punto de inyección natural es el header del `MainLayout.tsx`, que es el
layout envolvente de todas las rutas autenticadas (`/dashboard`, `/settings`, `/members`, etc.).

Implementa el **Module 3** de la spec (sección 3).

---

## Scope

- Modificar `src/layouts/MainLayout.tsx` para importar e inyectar `SubscriptionBanner`.
- El banner solo se muestra si `isAdmin === true` (leer del `AuthContext`).
- Pasar `currentBox.subscription_status` y `currentBox.trial_ends_at` como props al banner.
- Si `currentBox` es `null` (race condition al montar), no renderizar el banner.
- El banner se posiciona debajo del header principal (no dentro del topbar, sino como una barra
  fija secundaria debajo, o inline dentro del header con diseño compacto — ver implementation notes).

**NOT in scope**: Crear `SubscriptionBanner` (TASK-012), agregar claves i18n (TASK-020).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/layouts/MainLayout.tsx` | MODIFY | Inyectar `<SubscriptionBanner>` condicionalmente |

---

## Implementation Notes

### Leer del contexto y pasar props

```tsx
import { SubscriptionBanner } from '@/components/admin';
import { useAuth } from '@/contexts/AuthContext';

// Dentro del componente MainLayout:
const { isAdmin, currentBox } = useAuth();

// En el JSX del header/layout:
{isAdmin && currentBox && (
  <SubscriptionBanner
    status={currentBox.subscription_status ?? 'trial'}
    trialEndsAt={(currentBox as any).trial_ends_at ?? null}
  />
)}
```

> **Nota**: El tipo `Box` en `AuthContext` puede no tener `trial_ends_at` aún si el tipo
> TypeScript no se ha actualizado. Usa `(currentBox as any).trial_ends_at` de forma temporal
> y agrega el tipo correcto en `src/types/supabase.ts` si TASK-011 ya está completo.

### Posición del banner en el layout

Observar la estructura actual de `MainLayout.tsx` antes de modificar. Dos opciones válidas:

**Opción A** (preferida): Banner como barra fina inmediatamente debajo del header sticky.
```tsx
<header className="sticky top-0 z-50 ...">
  {/* contenido del header existente */}
</header>
{isAdmin && currentBox && (
  <div className="sticky top-16 z-40">   {/* top-16 = altura del header */}
    <SubscriptionBanner ... />
  </div>
)}
```

**Opción B**: Banner dentro del header, a la derecha del logo/nav, como badge compacto.
Solo viable si el header tiene espacio horizontal.

Evaluar cuál encaja mejor con el diseño actual del header. Usar Opción A si hay dudas.

### Key Constraints

- No agregar lógica de negocio en `MainLayout`. Solo pasar props desde el contexto al componente.
- El `MainLayout` ya usa `useAuth()` — no crear un nuevo useContext.
- Si `currentBox.subscription_status === 'active'`, el `SubscriptionBanner` retorna `null` por sí
  solo. No necesitas verificarlo en el layout.

### References in Codebase

- `src/layouts/MainLayout.tsx` — archivo a modificar; leer completo antes de editar
- `src/contexts/AuthContext.tsx` — estructura de `currentBox` y `isAdmin`
- `src/components/admin/SubscriptionBanner.tsx` — componente a inyectar (TASK-012)

---

## Acceptance Criteria

- [ ] El banner aparece en el header cuando el admin navega a cualquier ruta autenticada.
- [ ] El banner NO aparece para usuarios con rol `coach`, `receptionist`, o `athlete`.
- [ ] Cuando `currentBox` es `null` (loading inicial), el banner no se renderiza (sin errores).
- [ ] El banner muestra el estado correcto: badge ámbar en trial, banner rojo en suspended.
- [ ] El layout existente no se rompe (verificar `/dashboard`, `/settings`, `/members`).
- [ ] `npx tsc --noEmit` pasa sin errores en `MainLayout.tsx`.

---

## Test Specification

```
Pasos de verificación manual en el browser:

1. Login como admin → verificar que el banner aparece según el status del box.
2. Login como coach → verificar que el banner NO aparece.
3. Cambiar `subscription_status` a 'trial' en Supabase → recargar → verificar badge ámbar.
4. Cambiar `subscription_status` a 'suspended' → recargar → verificar banner rojo.
5. Cambiar `subscription_status` a 'active' → recargar → verificar que no hay banner.
6. Navegar entre rutas (/dashboard, /settings, /members) → banner persiste sin parpadear.
```

---

## Agent Instructions

When you pick up this task:

1. **Read** `src/layouts/MainLayout.tsx` completo antes de modificar.
2. **Check dependencies** — TASK-011 y TASK-012 en `completed/`.
3. **Update status** en `sdd/tasks/.index.json` → `"in-progress"`.
4. **Identificar** el punto de inyección en el JSX del layout (header o inmediato debajo).
5. **Agregar** la importación y el uso condicional del banner.
6. **Verificar** visualmente con distintos roles y estados de suscripción.
7. **Mover** a `sdd/tasks/completed/` y actualizar el index.

---

## Completion Note

**Completed by**: antigravity
**Date**: 2026-03-04
**Notes**: El `SubscriptionBanner` fue integrado exitosamente en el `MainLayout` como una barra secundaria sticky debajo del header principal. Solo se renderiza para administradores y cuando el box no tiene estado 'active'.
**Deviations from spec**: none
