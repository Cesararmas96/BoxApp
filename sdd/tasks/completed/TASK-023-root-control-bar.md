# TASK-023: Implement RootControlBar component

**Feature**: root-navigation
**Spec**: `sdd/specs/root-navigation.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: M (2-4h)
**Depends-on**: TASK-022
**Assigned-to**: claude-sonnet-4-6

---

## Context

El root user no tiene forma de saber en qué box está, ni de volver a `/admin`, ni de cambiar
a otro box sin abrir una nueva pestaña. Este componente crea un banner visual persistente
exclusivo para `isRoot === true` que resuelve los tres problemas de navegación.

Implementa **Module 2** del spec `sdd/specs/root-navigation.spec.md`.

---

## Scope

- Crear `src/components/admin/RootControlBar.tsx`.
- El componente lee `isRoot`, `currentBox` desde `useAuth()`.
- Si `!isRoot`, retorna `null` (invisible para todos los demás usuarios).
- Renderiza una barra con fondo `bg-amber-500/10 border-amber-500/30` para indicar "modo inspector".
- **Botón "← Panel Admin"**: llama `clearDevTenantSlug()` luego `window.location.href = '/admin'`.
- **Label**: "Inspeccionando: {currentBox.name}" o "Sin box seleccionado" si `currentBox === null`.
- **Badge "Suspendido"**: visible si `currentBox?.subscription_status === 'suspended'`.
- **Dropdown "cambiar"**: fetcha `SELECT id, name, slug FROM boxes ORDER BY name` al montar.
  Al seleccionar un box: `window.location.href = buildTenantUrl(slug)` (dev: `?box=slug`,
  prod: `https://slug.boxora.website/dashboard`). Con `max-h-60 overflow-y-auto` para muchos boxes.
- Exportar desde `src/components/admin/index.ts`.

**NOT in scope**: Modificar MainLayout (eso es TASK-024). Lógica de RLS. Cambios en AuthContext.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/admin/RootControlBar.tsx` | CREATE | El componente completo |
| `src/components/admin/index.ts` | MODIFY | Agregar export del componente |

---

## Implementation Notes

### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Panel Admin    👁 Inspeccionando: AreaPrincipal  [▼ cambiar] │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern to Follow

```tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { buildTenantUrl, clearDevTenantSlug } from '@/utils/tenant';
import { supabase } from '@/lib/supabaseClient';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const RootControlBar: React.FC = () => {
    const { isRoot, currentBox } = useAuth();
    const [boxes, setBoxes] = useState<{ id: string; name: string; slug: string }[]>([]);

    useEffect(() => {
        if (!isRoot) return;
        supabase
            .from('boxes' as any)
            .select('id, name, slug')
            .order('name')
            .then(({ data }) => { if (data) setBoxes(data as any); });
    }, [isRoot]);

    if (!isRoot) return null;

    const handleGoToAdmin = () => {
        clearDevTenantSlug();
        window.location.href = '/admin';
    };

    const handleBoxChange = (slug: string) => {
        const url = buildTenantUrl(slug);
        // buildTenantUrl returns '/?box=slug' in dev — redirect to /dashboard to avoid
        // React Router redirect back to /admin
        const target = url.startsWith('http')
            ? url
            : `${window.location.origin}/dashboard?box=${slug}`;
        window.location.href = target;
    };

    return (
        <div className="flex items-center justify-between px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/30 text-xs font-medium">
            <Button variant="ghost" size="sm" onClick={handleGoToAdmin} className="h-7 gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20">
                <ArrowLeft className="h-3.5 w-3.5" />
                Panel Admin
            </Button>

            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Building2 className="h-3.5 w-3.5" />
                {currentBox ? (
                    <>
                        <span>Inspeccionando: <strong>{currentBox.name}</strong></span>
                        {(currentBox as any).subscription_status === 'suspended' && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase">
                                Suspendido
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-muted-foreground">Sin box seleccionado</span>
                )}
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20">
                        cambiar <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 max-h-60 overflow-y-auto">
                    {boxes.map((box) => (
                        <DropdownMenuItem
                            key={box.id}
                            onClick={() => handleBoxChange(box.slug)}
                            className="cursor-pointer text-sm"
                        >
                            {box.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
```

### Key Constraints

- `clearDevTenantSlug()` debe llamarse ANTES de `window.location.href = '/admin'` para
  limpiar el sessionStorage del tenant dev.
- Usar `window.location.href` (full reload), NO `navigate()` de React Router, para que
  `TenantProvider` se re-inicialice con el nuevo slug.
- La URL de cambio de box en dev debe incluir `/dashboard?box=slug` (no `/?box=slug`),
  para evitar que React Router `Route path="/"` redirija a `/admin`.
- El dropdown fetch corre solo cuando `isRoot === true` — sin perder renders de usuarios normales.

### References in Codebase

- `src/components/admin/SubscriptionBanner.tsx` — componente de banner similar en estructura
- `src/utils/tenant.ts` — `buildTenantUrl()` y `clearDevTenantSlug()`
- `src/contexts/AuthContext.tsx` — `isRoot`, `currentBox`

---

## Acceptance Criteria

- [ ] Archivo `src/components/admin/RootControlBar.tsx` creado y exportado desde `index.ts`.
- [ ] Componente invisible para usuarios no-root (retorna `null` si `!isRoot`).
- [ ] Botón "Panel Admin" navega a `/admin` y limpia sessionStorage.
- [ ] Label muestra el nombre del box actual (o "Sin box seleccionado").
- [ ] Badge "Suspendido" aparece si `subscription_status === 'suspended'`.
- [ ] Dropdown carga todos los boxes y la selección navega al box correcto.
- [ ] `npx tsc --noEmit` sin errores en archivos modificados/creados.

---

## Test Specification

```
Verificación manual:

1. Login como root@test.com → /dashboard?box=principal
   ✓ Control bar visible con fondo ámbar
   ✓ Label: "Inspeccionando: AreaPrincipal"
   ✓ Click "Panel Admin" → navega a /admin (control bar desaparece)

2. Login como root@test.com → /dashboard?box=principal
   ✓ Click "cambiar" → dropdown lista todos los boxes
   ✓ Seleccionar "CrossFit Beta" → navega a /dashboard?box=crossfit-beta
   ✓ Label actualiza a "Inspeccionando: CrossFit Beta"

3. Login como admin@test.com → /dashboard?box=principal
   ✓ Control bar NO visible

4. root@test.com visita box suspendido:
   ✓ Badge "Suspendido" visible en el label del control bar
```

---

## Agent Instructions

Cuando retomes esta tarea:

1. **Read the spec** at `sdd/specs/root-navigation.spec.md`.
2. **Check dependencies** — TASK-022 debe estar en `completed/`.
3. **Update status** en `sdd/tasks/.index.json` → `"in-progress"`.
4. **Implement** `RootControlBar.tsx` siguiendo el pattern arriba.
5. **Export** desde `src/components/admin/index.ts`.
6. **Run** `npx tsc --noEmit` — sin errores en archivos nuevos.
7. **Move** a `sdd/tasks/completed/TASK-023-root-control-bar.md`.
8. **Update index** → `"done"`.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-06
**Notes**: Componente creado en `src/components/admin/RootControlBar.tsx` y exportado desde
`index.ts`. Usa `as unknown as BoxOption[]` para el cast del resultado Supabase (tabla
referenciada como `'boxes' as any` por limitaciones del tipo generado). El cast `as unknown`
es necesario porque supabase-js no puede inferir el tipo de una tabla referenciada como string.
**Deviations from spec**: ninguna.
