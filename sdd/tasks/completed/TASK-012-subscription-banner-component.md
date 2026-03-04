# TASK-012: Implement SubscriptionBanner component

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: in-progress
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-011
**Assigned-to**: antigravity

---

## Context

El `SubscriptionBanner` es el componente que mantiene al admin informado del estado de suscripción
de su box en todo momento, visible desde cualquier ruta de la aplicación (inyectado en el header
del `MainLayout`). Es la primera señal visual de que el box necesita atención (trial próximo a
vencer, box suspendido).

Implementa el **Module 2** de la spec (sección 3). La integración en `MainLayout` es TASK-013.

---

## Scope

- Crear `src/components/admin/SubscriptionBanner.tsx` con la interfaz `SubscriptionBannerProps`.
- Implementar los tres estados visuales:
  - `active`: no renderiza nada (retorna `null`).
  - `trial`: badge ámbar discreto con texto "Trial · X días restantes" y botón "Actualizar plan".
  - `suspended` / `cancelled`: banner rojo prominente con texto de advertencia y CTA de soporte.
- Calcular días restantes desde `trialEndsAt` (ISO string) hasta `new Date()`.
- El botón "Actualizar plan" es un `<a href="mailto:soporte@boxora.com">` (placeholder MVP).
- Usar clases semánticas de Tailwind (`bg-amber-500/10`, `text-amber-600`, etc.) compatibles con
  dark/light mode.

**NOT in scope**: Integración en `MainLayout` (TASK-013), lógica de fetch de datos.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/admin/SubscriptionBanner.tsx` | CREATE | Componente principal |
| `src/components/admin/index.ts` | CREATE | Barrel export para el directorio admin |

---

## Implementation Notes

### Interface del componente

```tsx
type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

interface SubscriptionBannerProps {
  status: SubscriptionStatus;
  trialEndsAt: string | null; // ISO date string, e.g. "2026-04-01T00:00:00Z"
}
```

### Lógica de días restantes

```tsx
function getDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
```

### Estados visuales esperados

**Trial (> 7 días)**: Badge pequeño ámbar en el header, no intrusivo.
```
⏳ Trial · 24 días restantes  [Actualizar plan →]
```

**Trial (≤ 7 días)**: Badge ámbar más prominente con borde.
```
⚠️ Trial vence en 5 días  [Actualizar plan →]
```

**Suspended / Cancelled**: Banner rojo visible debajo del header o inline.
```
🔴 Tu box está suspendido. Contacta a soporte para reactivarlo.  [Contactar soporte →]
```

### Key Constraints

- No importar nada de `AuthContext` en este componente — recibe sus props desde el padre.
- Usar `lucide-react` para íconos (`AlertTriangle`, `Clock`, `XCircle`).
- Usar `Button` de `src/components/ui/button.tsx` con `variant="ghost"` o `asChild` para el CTA.
- El componente debe ser puro (sin side effects, sin useState). Solo derivar estado de props.

### References in Codebase

- `src/pages/SuperAdmin.tsx` — patrón `StatusBadge` y clases de colores por status (líneas 43-50)
- `src/components/ui/button.tsx` — variantes disponibles de Button
- `src/components/ui/badge.tsx` — para badges de estado

---

## Acceptance Criteria

- [ ] `src/components/admin/SubscriptionBanner.tsx` existe y compila sin errores TypeScript.
- [ ] Con `status="active"`, el componente retorna `null` (no renderiza nada).
- [ ] Con `status="trial"` y `trialEndsAt` en el futuro, renderiza badge ámbar con días correctos.
- [ ] Con `status="trial"` y `trialEndsAt` en el pasado (0 días), muestra "0 días restantes".
- [ ] Con `status="suspended"`, renderiza banner rojo con CTA de soporte.
- [ ] Con `status="cancelled"`, renderiza banner rojo (mismo visual que suspended).
- [ ] El CTA es un link `mailto:soporte@boxora.com`.
- [ ] El componente usa clases semánticas de Tailwind (no colores hardcoded tipo `#FF0000`).
- [ ] `npx tsc --noEmit` pasa sin errores.

---

## Test Specification

```tsx
// Verificación manual en browser (no hay test runner configurado):

// 1. Importar en cualquier página de prueba:
import { SubscriptionBanner } from '@/components/admin';

// 2. Renderizar con cada estado:
<SubscriptionBanner status="active" trialEndsAt={null} />
// Esperado: nada visible

<SubscriptionBanner status="trial" trialEndsAt="2026-04-01T00:00:00Z" />
// Esperado: badge ámbar con días restantes

<SubscriptionBanner status="trial" trialEndsAt="2026-03-01T00:00:00Z" />
// Esperado: badge ámbar con "0 días restantes"

<SubscriptionBanner status="suspended" trialEndsAt={null} />
// Esperado: banner rojo con CTA

<SubscriptionBanner status="cancelled" trialEndsAt={null} />
// Esperado: banner rojo con CTA
```

---

## Agent Instructions

When you pick up this task:

1. **Read the spec** — Module 2, sección 3, y la interfaz en sección 2 (Data Models).
2. **Check dependencies** — TASK-011 debe estar en `completed/` (necesitas `trial_ends_at` definido).
3. **Update status** en `sdd/tasks/.index.json` → `"in-progress"`.
4. **Crear el directorio** `src/components/admin/` si no existe.
5. **Implementar** el componente con los 3 estados visuales.
6. **Crear** `src/components/admin/index.ts` con barrel export.
7. **Verificar** visualmente en el browser todos los estados.
8. **Mover** este archivo a `sdd/tasks/completed/`.
9. **Actualizar** el index.

---

## Completion Note

**Completed by**: antigravity
**Date**: 2026-03-03
**Notes**: El componente `SubscriptionBanner` fue implementado con soporte para los estados `active`, `trial` (con distinción de urgencia a los 7 días) y `suspended/cancelled`. Se habilitó la exportación en el barrel common `src/components/admin/index.ts`.
**Deviations from spec**: none
