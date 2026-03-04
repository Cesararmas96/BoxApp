# TASK-014: Implement KpiCard reusable component

**Feature**: Panel Administrativo de Box
**Spec**: `sdd/specs/panel-administrativo.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

`KpiCard` es el bloque visual fundamental del tab "Operaciones" del dashboard admin. Se reutiliza
4 veces (ingresos del mes, nuevos miembros, clases del día, tasa de ocupación). Debe soportar
los estados `loading` (skeleton) y `error` (muestra `—`) de forma aislada, para que un fallo
en una métrica no impacte las demás.

Implementa el **Module 4** de la spec (sección 3).

---

## Scope

- Crear `src/components/admin/KpiCard.tsx` con la interfaz `KpiCardProps`.
- Estado `loading`: mostrar skeleton animation (div con `animate-pulse`).
- Estado `error`: mostrar `—` como valor, con clase de color reducida.
- Delta positivo (> 0): texto verde con flecha ↑.
- Delta negativo (< 0): texto rojo con flecha ↓.
- Delta `undefined` o `0`: sin indicador de delta.
- Exportar desde `src/components/admin/index.ts`.

**NOT in scope**: Lógica de fetch de datos, integración en el dashboard (TASK-017).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/admin/KpiCard.tsx` | CREATE | Componente KPI card |
| `src/components/admin/index.ts` | MODIFY | Agregar export de KpiCard |

---

## Implementation Notes

### Interface

```tsx
interface KpiCardProps {
  label: string;           // "Ingresos del mes"
  value: number | string;  // "$12,450" o 42
  delta?: number;          // % vs mes anterior, e.g. 12.5 = +12.5%
  icon: React.ReactNode;   // Lucide icon component
  loading?: boolean;       // default: false
  error?: boolean;         // default: false
  unit?: string;           // "$" | "%" | "" — prefijo/sufijo del valor
}
```

### Estructura visual

```
┌─────────────────────────────┐
│  [icon]    Ingresos del mes  │
│                              │
│  $12,450   ↑ 12.5%          │
│                              │
└─────────────────────────────┘
```

### Implementación de referencia

```tsx
export const KpiCard: React.FC<KpiCardProps> = ({
  label, value, delta, icon, loading = false, error = false, unit = ''
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        <div className="h-8 w-20 bg-muted rounded" />
      </div>
    );
  }

  const displayValue = error ? '—' : `${unit}${value}`;
  const deltaColor = delta && delta > 0 ? 'text-emerald-500' : 'text-red-500';
  const deltaArrow = delta && delta > 0 ? '↑' : '↓';

  return (
    <div className="rounded-2xl bg-card border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm font-medium">{label}</span>
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${error ? 'text-muted-foreground' : 'text-foreground'}`}>
          {displayValue}
        </span>
        {!error && delta !== undefined && delta !== 0 && (
          <span className={`text-xs font-semibold mb-0.5 ${deltaColor}`}>
            {deltaArrow} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};
```

### Key Constraints

- No usar colores hardcoded. Usar `text-emerald-500` / `text-red-500` para delta (Tailwind utilities).
- Usar `bg-card`, `border-border`, `text-foreground` para compatibilidad con dark/light mode.
- El ícono debe tener `className="h-4 w-4"` para consistencia de tamaño.

### References in Codebase

- `src/components/ui/card.tsx` — alternativa si se prefiere el componente Card existente como base
- `src/pages/Analytics.tsx` — ver cómo se usan métricas en tarjetas existentes
- `src/pages/SuperAdmin.tsx` — patrón de cards con métricas

---

## Acceptance Criteria

- [ ] `KpiCard` se renderiza correctamente con `loading=true` (skeleton visible).
- [ ] `KpiCard` muestra `—` cuando `error=true` (sin crashear).
- [ ] `KpiCard` muestra delta en verde con ↑ cuando `delta > 0`.
- [ ] `KpiCard` muestra delta en rojo con ↓ cuando `delta < 0`.
- [ ] `KpiCard` no muestra delta cuando `delta === undefined` o `delta === 0`.
- [ ] El componente respeta dark/light mode (clases semánticas).
- [ ] Exportado desde `src/components/admin/index.ts`.
- [ ] `npx tsc --noEmit` pasa sin errores.

---

## Test Specification

```tsx
// Verificación visual manual:

import { KpiCard } from '@/components/admin';
import { DollarSign } from 'lucide-react';

// Loading state
<KpiCard label="Ingresos" value={0} icon={<DollarSign className="h-4 w-4" />} loading />

// Error state
<KpiCard label="Ingresos" value={0} icon={<DollarSign className="h-4 w-4" />} error />

// Normal con delta positivo
<KpiCard label="Ingresos del mes" value="$12,450" delta={12.5}
  icon={<DollarSign className="h-4 w-4" />} unit="$" />

// Normal con delta negativo
<KpiCard label="Nuevos miembros" value={3} delta={-25}
  icon={<Users className="h-4 w-4" />} />

// Normal sin delta
<KpiCard label="Clases hoy" value={8}
  icon={<Calendar className="h-4 w-4" />} />
```

---

## Agent Instructions

When you pick up this task:

1. **Lee la spec** — Module 4 y las interfaces en sección 2.
2. **No hay dependencias** — este task puede ejecutarse en paralelo con TASK-012.
3. **Update status** en el index → `"in-progress"`.
4. **Crear** `src/components/admin/KpiCard.tsx`.
5. **Actualizar** `src/components/admin/index.ts` para exportarlo.
6. **Verificar** visualmente los estados loading, error, y los tres estados de delta.
7. **Mover** a completed y actualizar el index.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: unassigned
**Date**: —
**Notes**: —
**Deviations from spec**: none
