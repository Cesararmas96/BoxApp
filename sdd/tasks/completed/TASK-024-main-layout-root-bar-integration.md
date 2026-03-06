# TASK-024: Integrate RootControlBar into MainLayout

**Feature**: root-navigation
**Spec**: `sdd/specs/root-navigation.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: S (<2h)
**Depends-on**: TASK-023
**Assigned-to**: claude-sonnet-4-6

---

## Context

`RootControlBar` existe pero no está renderizado en ningún lugar. Esta tarea lo inserta en
`MainLayout.tsx` en la posición correcta (sobre el header existente), de forma que sea
visible en todas las páginas cuando `isRoot === true`.

Implementa **Module 3** del spec `sdd/specs/root-navigation.spec.md`.

---

## Scope

- Modificar `src/layouts/MainLayout.tsx`:
  - Importar `RootControlBar` desde `@/components/admin`.
  - Renderizar `<RootControlBar />` como primer elemento dentro del Content Wrapper,
    ANTES del `<header>` sticky existente. Debe ser sticky también (o parte del layout fijo).
- Destruir `isRoot` de `useAuth()` en MainLayout (actualmente solo usa `isAdmin`, `currentBox`, `signOut`).

**NOT in scope**: Crear el componente (TASK-023). Cambiar el diseño del header para usuarios normales.
Añadir lógica adicional al componente.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/layouts/MainLayout.tsx` | MODIFY | Importar y renderizar RootControlBar |

---

## Implementation Notes

### Exact Change in MainLayout.tsx

1. Añadir import:
```tsx
import { SubscriptionBanner, RootControlBar } from '@/components/admin';
```

2. Añadir `isRoot` al destructuring de `useAuth()`:
```tsx
const { currentBox, signOut, isAdmin, isRoot } = useAuth();
```

3. En el JSX, dentro del Content Wrapper (`<div className="flex-1 flex flex-col ...">`),
   agregar `<RootControlBar />` ANTES del `<header>`:

```tsx
{/* Content Wrapper */}
<div className="flex-1 flex flex-col min-w-0 lg:pl-[272px]">
    {/* Root Control Bar — inspector mode indicator (only visible to root) */}
    <RootControlBar />

    {/* Header — Apple-style navigation bar */}
    <header className="sticky top-0 z-30 ...">
        ...
    </header>
    ...
</div>
```

### Key Constraints

- `<RootControlBar />` ya maneja `if (!isRoot) return null` internamente — no necesita
  wrapper condicional en MainLayout.
- El componente debe aparecer ANTES del `<header>` para que al hacer scroll, el header
  quede fijo debajo del control bar (o ambos se muevan juntos).
- No modificar ninguna otra parte de `MainLayout.tsx`.
- `isRoot` importado de `useAuth()` pero el componente RootControlBar también lo lee
  internamente — el prop en MainLayout solo es para evitar renders condicionales en layout.

### References in Codebase

- `src/layouts/MainLayout.tsx` — archivo a modificar, líneas 43 y 284-292 (SubscriptionBanner)
- `src/components/admin/index.ts` — de donde importar RootControlBar

---

## Acceptance Criteria

- [ ] `<RootControlBar />` renderizado en `MainLayout.tsx` antes del `<header>`.
- [ ] Importado correctamente desde `@/components/admin`.
- [ ] `isRoot` añadido al destructuring de `useAuth()` en MainLayout.
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Visual smoke test: root user ve la barra ámbar en `/dashboard?box=principal`.
- [ ] Admin user NO ve la barra (invisible) — sin cambios visuales para no-root.

---

## Test Specification

```
Verificación manual:

1. npm run dev → http://localhost:5173/dashboard?box=principal como root@test.com
   ✓ Barra ámbar visible en la parte superior del layout
   ✓ Header normal visible debajo de la barra
   ✓ Al hacer scroll, la barra y el header quedan en posición fija

2. http://localhost:5173/members?box=principal como root@test.com
   ✓ Barra sigue visible al navegar a otra página dentro del mismo box

3. Como admin@test.com:
   ✓ Sin barra visible — layout idéntico al anterior
   ✓ SubscriptionBanner sigue funcionando normalmente
```

---

## Agent Instructions

Cuando retomes esta tarea:

1. **Read** `src/layouts/MainLayout.tsx` completo.
2. **Check dependencies** — TASK-023 debe estar en `completed/`.
3. **Update status** en `sdd/tasks/.index.json` → `"in-progress"`.
4. **Implement** los 3 cambios mínimos en MainLayout.
5. **Run** `npx tsc --noEmit` — sin errores.
6. **Move** a `sdd/tasks/completed/TASK-024-main-layout-root-bar-integration.md`.
7. **Update index** → `"done"`.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-06
**Notes**: 3 cambios en MainLayout.tsx: (1) import RootControlBar, (2) añadir isRoot al
destructuring de useAuth(), (3) renderizar `{isRoot && <RootControlBar />}` antes del header.
**Deviations from spec**: ninguna.
