# TASK-003: Create TenantContext and TenantProvider

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 2
**Status**: pending
**Priority**: high
**Estimated effort**: M (2-4h)
**Depends-on**: TASK-001, TASK-002
**Assigned-to**: unassigned

---

## Context

Actualmente no existe un contexto de tenant separado del de autenticación. El `AuthContext` carga el box después del login, pero para la nueva arquitectura de subdominio necesitamos conocer el box **antes** del login (para mostrar el branding correcto y bloquear el acceso si está suspendido). Este task crea el `TenantContext` (Module 2 del spec).

---

## Scope

- Crear `src/contexts/TenantContext.tsx` con `TenantProvider` y hook `useTenant()`.
- Al montar, llamar a `getTenantSlug()` (TASK-002) para obtener el slug del hostname/query param.
- Si hay slug: hacer fetch anónimo a Supabase `boxes WHERE slug = <slug>` para obtener los datos del box (incluyendo `subscription_status` de TASK-001).
- Exponer via context: `tenantSlug`, `tenantBox`, `isTenantSubdomain`, `isLoading`.
- Si `tenantBox` existe pero el slug no matchea ningún box → exponer `tenantNotFound: true`.
- Si `subscription_status === 'suspended'` → exponer `isSuspended: true`.
- Si no hay slug (dominio principal) → el provider se comporta como "sin tenant" (todo `null`).

**NOT in scope**: La pantalla de suspensión (TASK-005). Los cambios en AuthContext (TASK-004). El enrutamiento (TASK-006). Nada de billing.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/contexts/TenantContext.tsx` | CREATE | Provider, context y hook |

---

## Implementation Notes

### Estructura del context

```typescript
// src/contexts/TenantContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getTenantSlug } from '@/utils/tenant';
import { Database } from '@/types/supabase';

type BoxRow = Database['public']['Tables']['boxes']['Row'];

interface TenantContextType {
  tenantSlug: string | null;
  tenantBox: BoxRow | null;
  isTenantSubdomain: boolean;  // true si getTenantSlug() !== null
  isSuspended: boolean;         // true si subscription_status === 'suspended'
  tenantNotFound: boolean;      // true si el slug no existe en la DB
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantBox, setTenantBox] = useState<BoxRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  const tenantSlug = getTenantSlug();
  const isTenantSubdomain = tenantSlug !== null;

  useEffect(() => {
    if (!tenantSlug) {
      setIsLoading(false);
      return;
    }

    const fetchBox = async () => {
      const { data, error } = await supabase
        .from('boxes')
        .select('*')
        .eq('slug', tenantSlug)
        .single();

      if (error || !data) {
        setTenantNotFound(true);
      } else {
        setTenantBox(data as BoxRow);
      }
      setIsLoading(false);
    };

    fetchBox();
  }, [tenantSlug]);

  const isSuspended = tenantBox?.subscription_status === 'suspended';

  return (
    <TenantContext.Provider value={{
      tenantSlug,
      tenantBox,
      isTenantSubdomain,
      isSuspended,
      tenantNotFound,
      isLoading,
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
};
```

### Key Constraints

- El fetch usa la **anon key** de Supabase (sin sesión). La RLS de `boxes` ya tiene `anon_select_by_slug` que permite esto.
- `subscription_status` es el campo añadido en TASK-001 — verificar que el tipo esté en `supabase.ts` antes de usar.
- El `useEffect` tiene `tenantSlug` como dependencia pero es una constante de `window.location` — se ejecuta solo una vez al montar.
- Si `tenantSlug === null` (dominio principal), `isLoading` debe pasar a `false` inmediatamente para no bloquear el render.
- `cancelled` debe tratarse como suspendido: `isSuspended = ['suspended', 'cancelled'].includes(tenantBox?.subscription_status)`.

### References en codebase

- `src/contexts/AuthContext.tsx` — patrón exacto a seguir para estructura del context
- `src/lib/supabaseClient.ts` — cliente de Supabase a importar
- `src/types/supabase.ts:97` — tipo `BoxRow` base
- `supabase/migrations/20260219_superadmin_rls.sql` — política `anon_select_by_slug` que habilita el fetch anon

---

## Acceptance Criteria

- [ ] `TenantProvider` renderiza sus children sin error en dominio principal (sin slug)
- [ ] `useTenant().tenantBox` es `null` cuando no hay slug (dominio principal)
- [ ] `useTenant().tenantBox` contiene los datos del box cuando el slug matchea
- [ ] `useTenant().tenantNotFound` es `true` cuando el slug no existe en la DB
- [ ] `useTenant().isSuspended` es `true` cuando `subscription_status === 'suspended'`
- [ ] `useTenant().isLoading` pasa a `false` tras el fetch (o inmediatamente si no hay slug)
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] No hay llamadas autenticadas — el fetch usa la anon key

---

## Test Specification

Tests manuales (no hay test runner configurado):

```
Escenario 1: Dominio principal (localhost sin ?box=)
  → useTenant() = { tenantSlug: null, tenantBox: null, isTenantSubdomain: false, isLoading: false }

Escenario 2: Slug válido (localhost?box=crossfit-demo)
  → useTenant() = { tenantSlug: 'crossfit-demo', tenantBox: { name: 'CrossFit Demo', ... }, isLoading: false }

Escenario 3: Slug inválido (localhost?box=no-existe)
  → useTenant() = { tenantNotFound: true, tenantBox: null, isLoading: false }

Escenario 4: Box suspendido
  → subscription_status = 'suspended' en DB
  → useTenant() = { isSuspended: true, tenantBox: { subscription_status: 'suspended' } }
```

---

## Agent Instructions

1. Verificar TASK-001 y TASK-002 están completados
2. Leer `src/contexts/AuthContext.tsx` como patrón de referencia
3. Crear `src/contexts/TenantContext.tsx`
4. Probar manualmente en el browser con `?box=<slug-existente>`
5. Ejecutar `npx tsc --noEmit`
6. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: —
**Date**: —
**Notes**: —
**Deviations from spec**: none
