# TASK-004: Update AuthContext to accept tenantBoxId prop

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 3
**Status**: in-progress
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-003
**Assigned-to**: antigravity

---

## Context

El `AuthContext` actual obtiene el `box_id` del perfil del usuario después del login. Con la nueva arquitectura de subdominio, el `box_id` del tenant ya se conoce antes del login (viene de `TenantContext`). Este task modifica `AuthProvider` para recibir el `tenantBoxId` como prop y usarlo para:
1. Pre-rellenar el `box_id` en el signup del wizard (TASK-007).
2. Validar que el usuario que se loguea pertenece a ese box (seguridad).

---

## Scope

- Añadir prop opcional `tenantBoxId?: string` al `AuthProvider`.
- En `signUp`: si `tenantBoxId` está presente, incluirlo en `user_metadata: { box_id: tenantBoxId }` para que el trigger de Supabase lo use al crear el profile.
- En `fetchProfile`: si el profile cargado no tiene `box_id` pero `tenantBoxId` está disponible, actualizar el profile automáticamente (caso de usuarios creados por el wizard antes del trigger).
- El cambio es **aditivo**: si `tenantBoxId` es `undefined`, el comportamiento actual no cambia.

**NOT in scope**: La validación de que el usuario pertenece al tenant (es una mejora de seguridad futura). El renderizado de `SuspendedScreen` (TASK-005/TASK-006). Cambios en el routing (TASK-006).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/contexts/AuthContext.tsx` | MODIFY | Añadir prop `tenantBoxId` al Provider y usarlo en signUp y fetchProfile |

---

## Implementation Notes

### Cambios mínimos en AuthProvider

```typescript
// Cambio 1: Actualizar props del Provider
export const AuthProvider: React.FC<{
  children: React.ReactNode;
  tenantBoxId?: string;  // NUEVO
}> = ({ children, tenantBoxId }) => {
  // ... estado existente ...

  const fetchProfile = async (userId: string) => {
    // ... lógica existente ...
    // Añadir al final del bloque de éxito:
    if (data && !(data as any).box_id && tenantBoxId) {
      await supabase
        .from('profiles')
        .update({ box_id: tenantBoxId })
        .eq('id', userId);
      (data as any).box_id = tenantBoxId;
    }
    // ... resto de lógica existente ...
  };

  const signUp = async (credentials: any) => {
    setLoading(true);
    // MODIFICADO: inyectar box_id en metadata si tenantBoxId está disponible
    const enrichedCredentials = tenantBoxId
      ? {
          ...credentials,
          options: {
            ...credentials.options,
            data: { ...credentials.options?.data, box_id: tenantBoxId },
          },
        }
      : credentials;

    const result = await supabase.auth.signUp(enrichedCredentials);
    // ... resto igual ...
  };
```

### Key Constraints

- **Cambio mínimo**: solo se tocan `signUp` y la parte final de `fetchProfile`. El resto del AuthContext no cambia.
- El prop `tenantBoxId` viene de `TenantContext` y es el `tenantBox?.id` (el UUID, no el slug).
- Verificar el trigger `handle_new_user` en Supabase: debe leer `raw_user_meta_data->>'box_id'` para asignar el `box_id` al profile. Si el trigger no existe o no lee el metadata, documentarlo como deuda técnica.

### Trigger check (verificar manualmente)

En Supabase Dashboard → SQL Editor:
```sql
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```
Si retorna vacío o no tiene `raw_user_meta_data->>'box_id'`, el `fetchProfile` fallback (que actualiza el profile) actuará como respaldo.

### References en codebase

- `src/contexts/AuthContext.tsx` — archivo a modificar (leer completo antes)
- `src/contexts/TenantContext.tsx` (TASK-003) — fuente del `tenantBoxId`
- `supabase/migrations/20260219_rls_multi_tenant_isolation.sql` — confirmar que el trigger existe

---

## Acceptance Criteria

- [ ] `AuthProvider` acepta la prop `tenantBoxId?: string` sin errores de TypeScript
- [ ] Si `tenantBoxId` se omite, el comportamiento del AuthContext es idéntico al actual
- [ ] Al llamar `signUp` con `tenantBoxId` presente, el user_metadata incluye `box_id`
- [ ] El profile del nuevo usuario tiene `box_id` asignado tras el signup
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Los tests manuales de login existente siguen funcionando

---

## Test Specification

Tests manuales:

```
Escenario 1: AuthProvider sin tenantBoxId (comportamiento actual)
  → Login, signup y fetchProfile funcionan exactamente igual que antes

Escenario 2: AuthProvider con tenantBoxId = '<uuid-del-box>'
  → Al hacer signUp con email/password, el nuevo user tiene en su profile box_id = '<uuid-del-box>'
  → Verificar en Supabase: SELECT box_id FROM profiles WHERE email = '<new-email>'
```

---

## Agent Instructions

1. Leer `src/contexts/AuthContext.tsx` completo
2. Verificar el trigger de Supabase (query SQL indicada)
3. Aplicar los cambios mínimos descritos
4. Confirmar que el prop es opcional (no rompe el uso actual en `App.tsx`)
5. Ejecutar `npx tsc --noEmit`
6. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: antigravity
**Date**: 2026-03-03
**Notes**: Se actualizó el `AuthProvider` para recibir `tenantBoxId` como prop prop opcional. Se utiliza este prop en `fetchProfile` para reconciliar el `box_id` del perfil si falta, y en `signUp` para inyectar el `box_id` en el metadata del usuario. Esto permite que el flujo de multi-tenant funcione correctamente incluso si el trigger de Supabase no está configurado o falla inicialmente.
**Deviations from spec**: none
