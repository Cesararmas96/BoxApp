# TASK-008: Update Login page to use TenantContext

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 10
**Status**: done
**Priority**: medium
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-003
**Assigned-to**: claude-sonnet-4-6

---

## Context

La página de Login actualmente obtiene el branding del box de dos maneras: (1) via `useParams<{ boxSlug }>` de la route `/box/:slug`, o (2) haciendo un fetch propio a Supabase si no hay slug en la URL. Con la nueva arquitectura, `TenantContext` ya resolvió el box antes de que el Login renderice — no es necesario hacer un fetch adicional ni depender de los params de la route. Este task simplifica `Login.tsx` para consumir el box desde `useTenant()`.

---

## Scope

- Reemplazar `useParams<{ boxSlug?: string }>` por `useTenant()` para obtener el box.
- Eliminar el `useEffect` que hace el fetch de branding (ya no es necesario — lo hace `TenantContext`).
- Usar `tenantBox` para el branding (logo, background, nombre).
- Usar `tenantBox?.id` para pasar el `boxId` a `signInWithGoogle()` (ya existe este parámetro en AuthContext).
- Mantener el estado `boxNotFound` si `tenantNotFound` es `true` (pero este caso ahora lo maneja `App.tsx` antes de llegar al Login — simplificar o eliminar).
- El diseño visual del Login no cambia.

**NOT in scope**: Rediseño del Login. Cambios en el manejo del OAuth callback. La lógica de suspensión (ya manejada en TASK-006 antes de que Login renderice).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/Login.tsx` | MODIFY | Reemplazar fetch propio por useTenant(); eliminar useParams |

---

## Implementation Notes

### Cambios principales en Login.tsx

```typescript
// ANTES:
import { useParams } from 'react-router-dom';
// ...
const { boxSlug } = useParams<{ boxSlug?: string }>();
const [branding, setBranding] = useState<BoxBranding | null>(null);
const [bgLoaded, setBgLoaded] = useState(false);
const [boxNotFound, setBoxNotFound] = useState(false);

// useEffect que hace fetch a Supabase para obtener branding
useEffect(() => {
  const fetchBranding = async () => { /* ... fetch ... */ };
  fetchBranding();
}, [boxSlug]);

// DESPUÉS:
import { useTenant } from '@/contexts/TenantContext';
// ...
const { tenantBox, isTenantSubdomain } = useTenant();
// 'tenantBox' reemplaza 'branding' en toda la template
// No hay useEffect de fetch
```

### Renombrar referencias de `branding` a `tenantBox`

En el JSX, reemplazar:
- `branding?.logo_url` → `tenantBox?.logo_url`
- `branding?.name` → `tenantBox?.name`
- `branding?.login_background_url` → `tenantBox?.login_background_url`
- `branding?.id` (en `signInWithGoogle`) → `tenantBox?.id`

### Pre-load de background (mantener)

El `useEffect` que hace pre-load de la imagen de fondo con `new Image()` debe conservarse — solo cambiar la fuente:
```typescript
// Mantener este useEffect, solo cambiar la dependencia
useEffect(() => {
  const src = tenantBox?.login_background_url || DEFAULT_BG;
  const img = new Image();
  img.onload = () => setBgLoaded(true);
  img.src = src;
}, [tenantBox]);
```

### Google OAuth con box context

```typescript
const handleGoogleSignIn = async () => {
  setGoogleLoading(true);
  // Pasar el boxId del tenant actual para que AuthContext lo reconcilie
  await signInWithGoogle(tenantBox?.id);
  setGoogleLoading(false);
};
```

### Key Constraints

- El estado local `branding` y su tipo `BoxBranding` se eliminan — usar directamente el tipo del context.
- El estado `boxNotFound` se elimina: App.tsx (TASK-006) ya muestra `TenantNotFound` antes de renderizar Login.
- El `useParams` import también se elimina si ya no se usa en ninguna otra parte de Login.
- El Login debe seguir funcionando en el dominio principal (`boxora.website/login`) sin tenant — en ese caso `tenantBox` es `null` y el Login muestra el fondo genérico (`DEFAULT_BG`).

### References en codebase

- `src/pages/Login.tsx` — archivo completo a modificar (leer antes)
- `src/contexts/TenantContext.tsx` (TASK-003) — hook `useTenant` a importar
- `src/contexts/AuthContext.tsx` — `signInWithGoogle(boxId?)` ya acepta el boxId

---

## Acceptance Criteria

- [ ] Login en `localhost/login` (sin tenant) muestra fondo genérico, sin errores
- [ ] Login en `localhost?box=<slug>` muestra logo y fondo del box correcto
- [ ] Login en `localhost?box=<slug>` — "Entrar con Google" pasa el `boxId` correctamente
- [ ] No hay llamadas redundantes a Supabase en Login (el fetch de branding fue eliminado)
- [ ] El tipo `BoxBranding` local y el estado `branding` son eliminados del archivo
- [ ] `useParams` es eliminado del archivo (si no se usa para nada más)
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] El diseño visual del Login no cambia

---

## Test Specification

Tests manuales:

```
1. Login sin tenant (boxora.website/login):
   → Fondo genérico DEFAULT_BG, sin logo específico
   → Formulario funcional (email + password)

2. Login con tenant (localhost?box=<slug-existente>):
   → Logo del box visible
   → Fondo personalizado del box
   → Nombre del box en el header

3. Google OAuth en subdomain:
   → Click "Entrar con Google" → redirige a Google
   → Al volver, el profile tiene el box_id correcto
```

---

## Agent Instructions

1. Verificar TASK-003 completado
2. Leer `src/pages/Login.tsx` completo
3. Identificar todos los usos de `branding`, `boxSlug`, `boxNotFound`
4. Aplicar los reemplazos mínimos descritos
5. Verificar que el Login funciona con y sin tenant
6. Ejecutar `npx tsc --noEmit`
7. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-03
**Notes**: Eliminados: `useParams`, interfaz `BoxBranding`, estado `branding`/`boxNotFound`, useEffect de fetch, bloque `if (boxNotFound)`. Añadido: `import { useTenant }`, `const { tenantBox } = useTenant()`. Actualizados: backgroundUrl/boxName/logoUrl, signUp metadata, handleGoogleSignIn (pasa `tenantBox?.id`), pre-load useEffect (dep: tenantBox). Cero errores TypeScript nuevos.
**Deviations from spec**: ninguna.
