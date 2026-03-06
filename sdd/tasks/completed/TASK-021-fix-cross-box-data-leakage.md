# TASK-021: Fix cross-box data leakage and Visitar Box navigation

**Feature**: multi-tenant-platform
**Spec**: `sdd/specs/multi-tenant-platform.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: M (2-4h)
**Depends-on**: TASK-002, TASK-003, TASK-004, TASK-006
**Assigned-to**: claude-sonnet-4-6

---

## Context

Post-implementación del feature multi-tenant se detectaron tres bugs críticos relacionados
con el aislamiento de datos entre boxes y la navegación desde el panel SuperAdmin:

1. El botón "Visitar Box" en SuperAdmin no navegaba al box (redirección silenciosa de vuelta a `/admin`).
2. Cualquier usuario que visitara el subdominio de un box diferente al suyo tenía su `box_id`
   sobreescrito en DB, causando que viera datos del box visitado en lugar del suyo propio.
3. El superadmin (`root@test.com`) veía siempre los datos de su box de perfil (CrossFit Beta)
   sin importar qué box visitara desde el panel.
4. El guard `isSuspended` bloqueaba al superadmin al intentar inspeccionar boxes suspendidos.

---

## Scope

- Corregir navegación del botón "Visitar Box" en `SuperAdmin.tsx`.
- Eliminar la escritura de `tenantBoxId` a la DB desde `AuthContext.tsx` para usuarios existentes.
- Hacer que `currentBox` para el root user refleje el box visitado (no su box de perfil).
- Eximir al root user del guard `isSuspended` en `App.tsx`.

**NOT in scope**: Impersonación de usuarios de un box, transferencia de sesión entre subdominios.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/SuperAdmin.tsx` | MODIFY | Fix botón Visitar Box + display URL |
| `src/contexts/AuthContext.tsx` | MODIFY | Fix reconciliación y resolución de currentBox |
| `src/App.tsx` | MODIFY | Guard isSuspended con isRoot |

---

## Root Cause Analysis

### Bug 1 — Visitar Box no funciona (`SuperAdmin.tsx`)

```
navigate('/?box=slug')
  → React Router: Route path="/" matches
  → <Navigate to='/admin' replace />   ← query param ?box= se pierde
  → URL vuelve a /admin, nada cambia visualmente
```

### Bug 2 — Cross-box data leakage (`AuthContext.tsx`)

```tsx
// ANTES (buggy):
const effectiveBoxId = oauthStoreBoxId || tenantBoxId;
if (effectiveBoxId && (!profileData.box_id || profileData.box_id !== effectiveBoxId)) {
    // Ejecutaba cuando profileData.box_id !== tenantBoxId
    // → Usuario en box A visita box B → se actualiza box_id = B en DB → ve datos de B
    await supabase.from('profiles').update({ box_id: effectiveBoxId })
}
```

La reconciliación fue diseñada para OAuth redirects (flujo de sign-up). Se ejecutaba
también cuando un usuario autenticado simplemente navegaba a otro subdominio, corrompiendo
su `box_id` en la DB silenciosamente.

### Bug 3 — Root user siempre ve el mismo box

`root@test.com` tiene un perfil en la DB con `box_id` apuntando a CrossFit Beta.
Con la lógica `boxId = profileData.box_id || tenantBoxId`, el `||` nunca llegaba a
`tenantBoxId` porque `profileData.box_id` siempre tenía valor. El root veía CrossFit Beta
en todos los boxes.

### Bug 4 — SuspendedScreen bloquea al superadmin

`isSuspended` se evaluaba antes del check de `isRoot` (que requiere auth loading completado).
Root visitando un box suspendido veía `<SuspendedScreen />` durante la carga del auth.

---

## Implementation Notes

### Fix 1 — `SuperAdmin.tsx`: `window.open` con URL directa

```tsx
// ANTES:
const url = buildTenantUrl(box.slug);  // dev → '/?box=slug'
if (url.startsWith('http')) { window.location.href = url; }
else { navigate(url); }  // ← React Router captura '/' y redirige a /admin

// DESPUÉS:
const target = url.startsWith('http')
    ? url
    : `${window.location.origin}/dashboard?box=${box.slug}`;
window.open(target, '_blank');
// - Prod: abre https://slug.boxora.website en nueva pestaña
// - Dev: abre http://localhost:5173/dashboard?box=slug en nueva pestaña
//        getTenantSlug() lee ?box= desde cualquier path, no solo desde /
```

Display corregido: `/box/{slug}` → `{slug}.boxora.website`

### Fix 2 — `AuthContext.tsx`: reconciliación solo para OAuth

```tsx
// DESPUÉS: solo oauthStoreBoxId escribe a DB
const oauthStoreBoxId = localStorage.getItem('pending_box_id');
if (oauthStoreBoxId) {
    localStorage.removeItem('pending_box_id');
    if (!isRootUser && oauthStoreBoxId !== profileData.box_id) {
        await supabase.from('profiles').update({ box_id: oauthStoreBoxId }).eq('id', userId);
        profileData.box_id = oauthStoreBoxId;
    }
}
// tenantBoxId NUNCA escribe a la DB — solo como fallback en memoria para currentBox
```

### Fix 3 — `AuthContext.tsx`: resolución de `currentBox` por rol

```tsx
// ANTES: const boxId = profileData.box_id || tenantBoxId;
// DESPUÉS:
const boxId = isRootUser
    ? tenantBoxId                              // root: siempre el box visitado
    : (profileData.box_id || tenantBoxId);    // usuarios: su box de perfil
```

### Fix 4 — `AuthContext.tsx`: `fetchProfile` recibe `sessionUser`

El estado de React (`session`, `user`) puede ser stale dentro de `fetchProfile` porque
los `setState` son asíncronos (batched por React). Para determinar `isRootUser` de forma
fiable, se añade el parámetro `sessionUser?: User`:

```tsx
// Antes: fetchProfile(userId: string)
// Después: fetchProfile(userId: string, sessionUser?: User)

const isRootUser =
    sessionUser?.email === 'root@test.com' ||
    sessionUser?.user_metadata?.is_root === true;
```

Todos los call sites actualizados para pasar el usuario explícitamente:
- `getSession()` → `fetchProfile(session.user.id, session.user)`
- `onAuthStateChange` → `fetchProfile(newSession.user.id, newSession.user)`
- `signIn` → `fetchProfile(result.data.user.id, result.data.user)`
- `signUp` → `fetchProfile(result.data.user.id, result.data.user)`
- `refreshProfile` → `fetchProfile(user.id, user)`

### Fix 5 — `App.tsx`: guard `isSuspended` con `isRoot`

```tsx
// ANTES:
if (isSuspended) { return <SuspendedScreen />; }

// DESPUÉS:
if (isSuspended && !isRoot) { return <SuspendedScreen />; }
```

---

## Acceptance Criteria

- [x] Superadmin hace click en "Visitar Box" → abre nueva pestaña con los datos del box correcto.
- [x] Usuario de box A visita subdominio de box B → sigue viendo datos de box A (sin fuga).
- [x] `root@test.com` visita box A → ve datos de box A. Visita box B → ve datos de box B.
- [x] `root@test.com` visita box suspendido → puede verlo (no se bloquea con SuspendedScreen).
- [x] OAuth sign-up en subdominio de tenant → `box_id` sigue reconciliándose correctamente.
- [x] `npx tsc --noEmit` sin errores nuevos en archivos modificados.

---

## Test Specification

```
Pasos de verificación manual:

1. Dev — Superadmin visita boxes:
   Login como root@test.com → /admin
   Click "Visitar Box" en AreaPrincipal → nueva pestaña con datos de AreaPrincipal
   Click "Visitar Box" en CrossFit Beta → nueva pestaña con datos de CrossFit Beta
   ✓ Cada pestaña muestra datos distintos según el box visitado.

2. Dev — Aislamiento de datos entre usuarios:
   Login como admin@test.com (?box=principal) → ver dashboard con datos de AreaPrincipal
   Navegar a /?box=crossfit-beta sin hacer logout
   ✓ Dashboard sigue mostrando datos de AreaPrincipal (el box del usuario)
   ✓ En DB: profiles.box_id de admin@test.com NO fue modificado

3. Dev — Root visita box suspendido:
   Desde SuperAdmin, cambiar un box a 'suspended'
   Click "Visitar Box" en ese box
   ✓ Se abre la nueva pestaña sin SuspendedScreen
   ✓ Usuarios no-admin que visiten ese box sí ven SuspendedScreen

4. Prod — URLs correctas:
   ✓ SuperAdmin muestra "slug.boxora.website" (no "/box/slug")
   ✓ Visitar Box abre https://slug.boxora.website en nueva pestaña
```

---

## Completion Note

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-06
**Notes**: Tres archivos modificados. La causa raíz del bug de data leakage era la
reconciliación agresiva de `tenantBoxId` → DB en `AuthContext.fetchProfile`, que fue
diseñada solo para OAuth redirects pero se ejecutaba en cualquier navegación a subdominio.
El bug del root user se debía a que su perfil en DB tenía `box_id` apuntando a CrossFit Beta,
impidiendo que `tenantBoxId` actuara como fallback. Ambos issues fueron confirmados con
consulta SQL a producción que reveló el estado real de la DB.
**Deviations from spec**: ninguna — la spec no describía este flujo de reconciliación,
fue una implementación implícita del TASK-004 que generó efectos secundarios.
