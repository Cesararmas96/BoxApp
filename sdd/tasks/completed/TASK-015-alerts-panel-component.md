# TASK-015: Implement AlertsPanel component

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: pending
**Priority**: medium
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

El `AlertsPanel` muestra al admin alertas operativas accionables: pagos vencidos, miembros
sin actividad en 30 días, clases con alta ocupación, etc. Las alertas se generan desde
múltiples queries en el Dashboard (TASK-017) y se pasan como props a este componente.

Implementa el **Module 5** de la spec (sección 3).

---

## Scope

- Crear `src/components/admin/AlertsPanel.tsx` con la interfaz `AlertsPanelProps`.
- Renderizar lista de alertas con ícono por tipo (`warning` = ámbar, `error` = rojo, `info` = azul).
- Si `alerts.length === 0` y `loading === false`: mostrar estado vacío positivo ("Todo en orden 🎉").
- Si `loading === true`: mostrar 3 filas skeleton.
- Cada alerta puede tener `actionLabel` + `actionHref` opcionales → link de navegación.
- Exportar desde `src/components/admin/index.ts`.

**NOT in scope**: Lógica de generación de alertas (eso va en TASK-017, en el Dashboard).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/admin/AlertsPanel.tsx` | CREATE | Componente de alertas |
| `src/components/admin/index.ts` | MODIFY | Agregar export de AlertsPanel |

---

## Implementation Notes

### Interfaces

```tsx
interface AdminAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  actionLabel?: string;
  actionHref?: string;  // ruta interna, e.g. "/billing"
}

interface AlertsPanelProps {
  alerts: AdminAlert[];
  loading: boolean;
}
```

> **Nota**: Exportar `AdminAlert` también desde el barrel `index.ts` — será necesario en TASK-017.

### Configuración visual por tipo

```tsx
const ALERT_CONFIG = {
  warning: {
    icon: AlertTriangle,
    classes: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  error: {
    icon: XCircle,
    classes: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
  info: {
    icon: Info,
    classes: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
};
```

### Estado vacío

```tsx
// Cuando alerts.length === 0 y !loading:
<div className="flex flex-col items-center justify-center py-8 text-center">
  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
  <p className="text-sm font-medium text-foreground">Todo en orden</p>
  <p className="text-xs text-muted-foreground mt-1">
    No hay alertas operativas pendientes.
  </p>
</div>
```

### Skeleton de carga

```tsx
// Cuando loading === true:
{Array.from({ length: 3 }).map((_, i) => (
  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
    <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-3/4 bg-muted rounded" />
      <div className="h-3 w-1/2 bg-muted rounded" />
    </div>
  </div>
))}
```

### Key Constraints

- Usar `Link` de `react-router-dom` para `actionHref` (rutas internas).
- No usar `<a>` con `href` para rutas internas (rompe el SPA routing).
- Limitar a máximo 5 alertas visibles (el Dashboard pasará las más críticas primero).
- El componente NO hace fetching — solo recibe datos como props.

### References in Codebase

- `lucide-react` — `AlertTriangle`, `XCircle`, `Info`, `CheckCircle2` ya disponibles
- `react-router-dom` — `Link` para navegación interna
- `src/components/ui/badge.tsx` — puede usarse para los chips de tipo

---

## Acceptance Criteria

- [ ] `AlertsPanel` renderiza correctamente con `loading=true` (skeletons visibles).
- [ ] Con `alerts=[]` y `loading=false`: muestra estado vacío positivo.
- [ ] Alerta tipo `warning`: ícono ámbar, fondo ámbar suave.
- [ ] Alerta tipo `error`: ícono rojo, fondo rojo suave.
- [ ] Alerta tipo `info`: ícono azul, fondo azul suave.
- [ ] Alertas con `actionLabel`/`actionHref` muestran link clicable que navega correctamente.
- [ ] Alertas sin `actionLabel` no muestran link.
- [ ] Exportado correctamente desde `src/components/admin/index.ts`.
- [ ] `npx tsc --noEmit` pasa sin errores.

---

## Test Specification

```tsx
// Verificación manual en browser:

import { AlertsPanel, AdminAlert } from '@/components/admin';

// Loading
<AlertsPanel alerts={[]} loading={true} />

// Empty state
<AlertsPanel alerts={[]} loading={false} />

// Con alertas mixtas
<AlertsPanel loading={false} alerts={[
  { id: '1', type: 'error', message: '3 pagos vencidos este mes',
    actionLabel: 'Ver pagos', actionHref: '/billing' },
  { id: '2', type: 'warning', message: '12 miembros sin clase en 30 días',
    actionLabel: 'Ver miembros', actionHref: '/members' },
  { id: '3', type: 'info', message: '2 clases con ocupación > 90%' },
]} />
```

---

## Agent Instructions

When you pick up this task:

1. **Lee la spec** — Module 5, sección 3.
2. **No hay dependencias** — puede ejecutarse en paralelo con TASK-012 y TASK-014.
3. **Update status** en el index → `"in-progress"`.
4. **Crear** `src/components/admin/AlertsPanel.tsx`.
5. **Exportar** `AdminAlert` y `AlertsPanel` desde `index.ts`.
6. **Verificar** los estados: loading, empty, con alertas de cada tipo.
7. **Mover** a completed y actualizar el index.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: antigravity
**Date**: 2026-03-03
**Notes**: El componente fue implementado exitosamente con soporte para estados de carga, vacío y visualización de alertas con acciones. Se corrigió un error en el barrel export index.ts que causaba fallos de compilación por componentes no existentes.
**Deviations from spec**: none
