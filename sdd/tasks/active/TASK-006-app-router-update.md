# TASK-006: Update App Router — integrate TenantProvider and clean routes

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 4
**Status**: pending
**Priority**: high
**Estimated effort**: M (2-4h)
**Depends-on**: TASK-003, TASK-004, TASK-005
**Assigned-to**: unassigned

---

## Context

`src/App.tsx` es el punto de entrada del routing. Actualmente no tiene `TenantProvider`, usa la route `/box/:boxSlug` para tenant login, y no tiene lógica de tenant suspension. Este task integra todos los contextos nuevos, limpia las rutas obsoletas, añade la route `/register`, y aplica la lógica de suspensión.

---

## Scope

- Envolver `AuthProvider` con `TenantProvider` en `App.tsx`.
- Pasar `tenantBox?.id` como prop `tenantBoxId` al `AuthProvider`.
- Eliminar la route `/box/:boxSlug` (ya no es necesaria — el tenant se resuelve desde el hostname).
- Añadir la route `/register` que renderiza `RegisterBox` (TASK-007).
- Mostrar `<SuspendedScreen />` cuando `isSuspended === true` (antes de mostrar cualquier otra cosa).
- Mostrar un spinner de carga mientras `TenantContext.isLoading === true`.
- Mostrar `<TenantNotFound />` (inline o componente simple) si `tenantNotFound === true`.
- Asegurar que `boxora.website/` (main domain, sin tenant) redirige a `/login`.

**NOT in scope**: La implementación de `RegisterBox` (TASK-007). La implementación de `SuspendedScreen` (TASK-005). Cambios en Login.tsx (TASK-010).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/App.tsx` | MODIFY | Integrar TenantProvider, limpiar routes, añadir suspensión y /register |

---

## Implementation Notes

### Nueva estructura de App.tsx

```tsx
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { SuspendedScreen } from './components/SuspendedScreen';
import { RegisterBox } from './pages/RegisterBox';

// AppContent interno que ya tiene acceso a TenantContext
function AppContent() {
  const { tenantBox, isSuspended, tenantNotFound, isLoading: tenantLoading } = useTenant();
  const { session, userProfile, currentBox, loading } = useAuth();
  // ... useEffect de branding existente ...

  // 1. Esperar a que el tenant cargue
  if (tenantLoading) {
    return <LoadingSpinner />;
  }

  // 2. Slug inválido
  if (tenantNotFound) {
    return <TenantNotFoundScreen />;
  }

  // 3. Box suspendido — mostrar antes del check de sesión
  if (isSuspended) {
    return <SuspendedScreen />;
  }

  // 4. Carga de Auth
  if (loading) {
    return <LoadingSpinner />;
  }

  // 5. Sin sesión — mostrar login/register
  if (!session) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* ELIMINADO: /box/:boxSlug — el branding ahora viene del hostname */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterBox />} />  {/* NUEVO */}
        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ... resto de rutas autenticadas (sin cambios) ...
}

// App wrapper principal
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TenantProvider>  {/* NUEVO: envuelve AuthProvider */}
        <AuthProviderWithTenant>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProviderWithTenant>
      </TenantProvider>
    </ThemeProvider>
  );
}

// Wrapper intermedio para pasar tenantBoxId a AuthProvider
function AuthProviderWithTenant({ children }: { children: React.ReactNode }) {
  const { tenantBox } = useTenant();
  return (
    <AuthProvider tenantBoxId={tenantBox?.id}>
      {children}
    </AuthProvider>
  );
}
```

### TenantNotFoundScreen (inline, sin componente separado)

```tsx
const TenantNotFoundScreen = () => (
  <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4">
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">Box no encontrado</h1>
      <p className="text-white/50">Este box no existe o fue eliminado.</p>
      <a href="https://boxora.website/register" className="text-sm text-white/40 hover:text-white">
        ¿Quieres registrar tu box? →
      </a>
    </div>
  </div>
);
```

### Key Constraints

- **`BrowserRouter` debe estar dentro de `TenantProvider`** porque el resolver de dev usa `window.location.search` (query params). Si se pone fuera, los query params del React Router y los nativos pueden entrar en conflicto. Por eso se usa el patrón `AuthProviderWithTenant`.
- **Eliminar `<Route path="/box/:boxSlug" ...>`**: Esta route ya no debe existir. Los atletas acceden vía subdominio.
- **La route `/admin`** permanece igual (solo accesible para `isSuperAdmin`).
- **El `useEffect` de branding** (`currentBox → document.title, favicon, theme`) permanece sin cambios.
- `isSuspended` se chequea **antes** del check de sesión para bloquear también a usuarios ya logueados.

### References en codebase

- `src/App.tsx` — archivo completo a modificar (leer antes)
- `src/contexts/TenantContext.tsx` (TASK-003) — `TenantProvider`, `useTenant`
- `src/contexts/AuthContext.tsx` — `AuthProvider` con nueva prop `tenantBoxId`
- `src/components/SuspendedScreen.tsx` (TASK-005)
- `src/pages/RegisterBox.tsx` (TASK-007) — importar (puede ser un stub si no está completo)

---

## Acceptance Criteria

- [ ] La app carga en `localhost` (sin `?box=`) y muestra `/login` normalmente
- [ ] La app carga en `localhost?box=<slug-valido>` y el branding del box está disponible
- [ ] `localhost?box=<slug-invalido>` muestra la pantalla "Box no encontrado"
- [ ] Un box con `subscription_status = 'suspended'` muestra `SuspendedScreen`
- [ ] La route `/register` renderiza el wizard (o un placeholder si TASK-007 no está completo)
- [ ] La route `/box/:boxSlug` ya NO existe y redirige a `/login`
- [ ] El super-admin (`isRoot`) puede entrar al `/admin` desde el dominio principal
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] El branding del box (title, favicon, theme) sigue funcionando vía `currentBox`

---

## Test Specification

Tests manuales de integración:

```
1. localhost/ → redirige a /login (sin tenant) ✓
2. localhost?box=<slug> → Login con branding del box ✓
3. localhost?box=<slug-suspendido> → SuspendedScreen ✓
4. localhost?box=slug-inexistente → TenantNotFound ✓
5. localhost/register → RegisterBox wizard ✓
6. localhost/box/cualquier-cosa → redirige a /login (route eliminada) ✓
7. boxora.website/admin → SuperAdmin (super-admin logueado) ✓
```

---

## Agent Instructions

1. Verificar TASK-003, TASK-004, TASK-005 completados
2. Leer `src/App.tsx` completo
3. Aplicar los cambios según el patrón descrito arriba
4. Si `RegisterBox` (TASK-007) no está listo, usar un placeholder `<div>Register coming soon</div>`
5. Probar los 7 escenarios manuales
6. Ejecutar `npx tsc --noEmit`
7. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: —
**Date**: —
**Notes**: —
**Deviations from spec**: none
