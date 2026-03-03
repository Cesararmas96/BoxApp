# TASK-005: Create SuspendedScreen component

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 5
**Status**: pending
**Priority**: medium
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-003
**Assigned-to**: unassigned

---

## Context

Cuando un tenant tiene `subscription_status === 'suspended'`, el acceso al dashboard debe estar bloqueado. En lugar de mostrar el dashboard o redirigir en bucle, se muestra una pantalla full-page que comunica el estado y da una vía de contacto. Este component es usado por el App Router (TASK-006) cuando `useTenant().isSuspended === true`.

---

## Scope

- Crear `src/components/SuspendedScreen.tsx` como componente React de pantalla completa.
- Mostrar:
  - Logo del box (si `tenantBox.logo_url` existe) o ícono genérico.
  - Nombre del box.
  - Mensaje claro: "Tu suscripción ha sido suspendida. Por favor contáctanos para reactivar."
  - Email de contacto: `soporte@boxora.website` (hardcoded por ahora).
  - Botón "Cerrar sesión" que llama a `signOut()` del `AuthContext`.
- Usar el mismo estilo visual del resto de la app (Tailwind, dark mode, paleta existente).
- Inspirarse en el diseño del `SuperAdmin.tsx` (dark background, cards glassmorphism).

**NOT in scope**: Lógica de suspensión (eso está en la DB y el SuperAdmin). El routing que decide cuándo mostrar esta pantalla (TASK-006).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/components/SuspendedScreen.tsx` | CREATE | Componente de pantalla bloqueante |

---

## Implementation Notes

### Estructura del componente

```tsx
import { AlertTriangle, Mail, LogOut } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const SuspendedScreen: React.FC = () => {
  const { tenantBox } = useTenant();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo o ícono */}
        {tenantBox?.logo_url ? (
          <img src={tenantBox.logo_url} alt={tenantBox.name} className="h-16 mx-auto rounded-2xl" />
        ) : (
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        )}

        {/* Box name */}
        {tenantBox?.name && (
          <p className="text-sm text-white/40 font-medium uppercase tracking-widest">
            {tenantBox.name}
          </p>
        )}

        {/* Título */}
        <h1 className="text-2xl font-bold">Cuenta suspendida</h1>

        {/* Mensaje */}
        <p className="text-white/50 text-sm leading-relaxed">
          La suscripción de este box ha sido suspendida. Para reactivar el acceso, contáctanos.
        </p>

        {/* Email de contacto */}
        <a
          href="mailto:soporte@boxora.website"
          className="flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <Mail className="h-4 w-4" />
          soporte@boxora.website
        </a>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="text-white/40 hover:text-white hover:bg-white/5 w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};
```

### Key Constraints

- El componente NO hace redirect — simplemente bloquea el render. El routing (TASK-006) decide cuándo mostrarlo.
- Debe funcionar tanto si el usuario está logueado como si no (un visitante que llega a un subdominio suspendido).
- Si `signOut()` se llama cuando el usuario no está logueado, no debe lanzar error (AuthContext ya maneja esto).
- El diseño debe seguir el mismo dark theme de `SuperAdmin.tsx` (`bg-[#050508]`).

### References en codebase

- `src/pages/SuperAdmin.tsx` — paleta de colores y estilo dark a seguir
- `src/components/ui/button.tsx` — componente Button a reutilizar
- `src/contexts/TenantContext.tsx` (TASK-003) — hook `useTenant`
- `src/contexts/AuthContext.tsx` — hook `useAuth` para `signOut`

---

## Acceptance Criteria

- [ ] El componente renderiza correctamente con un `tenantBox` con logo
- [ ] El componente renderiza correctamente sin logo (muestra ícono de alerta)
- [ ] El botón "Cerrar sesión" llama a `signOut()` sin errores
- [ ] El componente funciona cuando el usuario NO está autenticado (visitante)
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] El diseño es visualmente consistente con el resto de la app (dark theme)

---

## Test Specification

Tests manuales:

```
Escenario 1: Box suspendido, usuario logueado
  → Se muestra SuspendedScreen con nombre del box
  → Click "Cerrar sesión" → redirige a /login

Escenario 2: Box suspendido, usuario no logueado
  → Se muestra SuspendedScreen
  → Click "Cerrar sesión" → no hay error, permanece en pantalla o redirige a /login

Escenario 3: Box suspendido con logo
  → Se muestra el logo del box en lugar del ícono de alerta
```

---

## Agent Instructions

1. Verificar TASK-003 completado
2. Leer `src/pages/SuperAdmin.tsx` para el estilo visual
3. Crear el componente siguiendo el patrón de diseño
4. Verificar que funciona con y sin tenantBox.logo_url
5. Ejecutar `npx tsc --noEmit`
6. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: —
**Date**: —
**Notes**: —
**Deviations from spec**: none
