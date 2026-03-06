# Feature Specification: Root Navigation & Box Inspector

**Feature ID**: FEAT-004
**Date**: 2026-03-06
**Author**: Cesar Armas
**Status**: draft
**Target version**: 1.x

---

## 1. Motivation & Business Requirements

### Problem Statement

El usuario `root@test.com` (super-admin de Boxora) no puede operar efectivamente cuando inspecciona
los dashboards de los tenants:

1. **Sin navegación de retorno**: Dentro de `/dashboard?box=slug` no hay forma de volver a `/admin`
   sin cerrar la pestaña o teclear la URL manualmente.

2. **Sin selector de box**: No puede cambiar de box desde el dashboard sin abrir nuevas pestañas,
   generando confusión con múltiples pestañas abiertas.

3. **Datos en cero**: Las tablas `wods`, `invoices`, `sessions`, `bookings`, `leads`, `results`,
   `memberships`, `plans`, `expenses` y otras NO tienen política `is_super_admin()` en su RLS.
   `current_user_box_id()` retorna el box del perfil de root (CrossFit Beta), no el box visitado.
   Todas las queries con `.eq('box_id', visitedBox.id)` pasan el filtro RLS y retornan 0 filas.

### Goals

- Root puede volver a `/admin` con un clic desde cualquier página del dashboard.
- Root puede cambiar de box sin abrir nuevas pestañas.
- Root ve datos reales del box que está inspeccionando (mismo contenido que el admin del box).
- Indicador visual permanente que root está en "modo inspector" — no en operación normal.

### Non-Goals

- Impersonación de usuarios dentro del box (no se simula la sesión de otro usuario).
- Permisos de INSERT/UPDATE/DELETE para root en tablas de datos de box (solo SELECT read-only).
- Cambiar la forma en que usuarios regulares navegan o ven datos.
- Soporte para múltiples boxes abiertos simultáneamente en la misma pestaña.

---

## 2. Architectural Design

### Overview

**Opción elegida: Root Control Bar + RLS Superadmin Bypass** (Option A del brainstorm).

Un banner persistente en `MainLayout` visible únicamente cuando `isRoot === true`, complementado
por una migración SQL que añade `is_super_admin()` como bypass a todas las tablas de datos de box.

### Component Diagram

```
MainLayout
  ├── RootControlBar (isRoot === true)   ← NEW
  │     ├── Button "← Panel Admin"
  │     ├── Label "Inspeccionando: {boxName}"
  │     └── BoxSwitcherDropdown
  ├── Header (existente)
  ├── SubscriptionBanner (isAdmin)
  └── <Outlet />
```

### Integration Points

| Existing Component | Integration Type | Notes |
|---|---|---|
| `src/layouts/MainLayout.tsx` | extends | Agrega RootControlBar condicional sobre el header |
| `src/contexts/AuthContext.tsx` | read-only | `isRoot` ya exportado, no requiere cambios |
| `src/utils/tenant.ts` | uses | `buildTenantUrl(slug)` + `clearDevTenantSlug()` |
| `src/pages/SuperAdmin.tsx` | optional | Ningún cambio requerido por esta feature |
| `supabase/migrations/` | new migration | RLS bypass `is_super_admin()` en tablas de datos |

### Data Models

No se añaden nuevas tablas. La migración modifica políticas RLS existentes con el patrón:

```sql
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.{table};
CREATE POLICY "tenant_isolation_select" ON public.{table}
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR box_id = public.current_user_box_id());
```

### New Public Interfaces

**`RootControlBar` component** (`src/components/admin/RootControlBar.tsx`):
```tsx
// No props — reads isRoot, currentBox from AuthContext internally
export const RootControlBar: React.FC = () => { ... }
```

---

## 3. Module Breakdown

### Module 1: RLS Superadmin Bypass Migration

- **Path**: `supabase/migrations/20260306_superadmin_rls_all_tables.sql`
- **Responsibility**: Extender `tenant_isolation_select` en todas las tablas de datos de box
  para incluir `public.is_super_admin() OR ...`. Tablas afectadas: `wods`, `leads`, `expenses`,
  `invoices`, `plans`, `movements`, `personal_records`, `bookings`, `results`, `sessions`,
  `competitions`, `competition_events`, `competition_participants`, `competition_scores`,
  `competition_judges`, `competition_divisions`, `competition_teams`, `competition_heats`,
  `lane_assignments`, `automation_logs`, `functional_feedback`, `audit_logs`, `roles`.
- **Depends on**: `20260219_superadmin_rls.sql` (función `is_super_admin()` ya existe)

### Module 2: RootControlBar Component

- **Path**: `src/components/admin/RootControlBar.tsx`
- **Responsibility**: Banner visual para root con:
  - Botón "← Panel Admin" — navega a `/admin` con `window.location.href` (full reload + limpia tenant)
  - Label "Inspeccionando: {currentBox?.name}" — feedback visual del box actual
  - Dropdown "cambiar" — lista todos los boxes (query `SELECT id, name, slug FROM boxes`)
    y navega al seleccionado vía `window.location.href`
  - Badge "Suspendido" si `currentBox.subscription_status === 'suspended'`
  - Estado vacío: "Sin box seleccionado" cuando no hay `currentBox` (desde `/admin`)
- **Depends on**: AuthContext (`isRoot`, `currentBox`), `buildTenantUrl` de `tenant.ts`

### Module 3: MainLayout Integration

- **Path**: `src/layouts/MainLayout.tsx`
- **Responsibility**: Renderizar `<RootControlBar />` condicionalmente sobre el header existente.
  Solo cuando `isRoot === true`. Sin cambios de lógica existente.
- **Depends on**: Module 2

---

## 4. Test Specification

### Manual Verification Steps

| Step | Expected Result |
|---|---|
| Login como `root@test.com` → `/admin` → click "Visitar Box" en AreaPrincipal | Control bar visible con "Inspeccionando: AreaPrincipal" |
| Click "← Panel Admin" desde el dashboard de un box | Navega a `/admin`, control bar desaparece |
| Click dropdown "cambiar" → seleccionar CrossFit Beta | Navega al dashboard de CrossFit Beta con datos correctos |
| Dashboard de AreaPrincipal muestra conteo real de miembros (≥1) | Datos reales visibles, no 0 |
| Login como `admin@test.com` en AreaPrincipal | Control bar NO visible para usuario no-root |
| `root@test.com` visita box con `subscription_status = 'suspended'` | Control bar muestra badge "Suspendido" |

### Type Check

```bash
npx tsc --noEmit
```

---

## 5. Acceptance Criteria

- [ ] `RootControlBar` es visible cuando `isRoot === true` y el usuario está en el dashboard de un box.
- [ ] `RootControlBar` NO es visible para `isAdmin`, `isCoach`, ni `isAthlete`.
- [ ] Botón "← Panel Admin" navega a `/admin` y limpia el tenant del sessionStorage.
- [ ] Dropdown "cambiar" lista todos los boxes y la selección navega al box correcto.
- [ ] Dashboard de cualquier box muestra datos reales (>0 miembros en AreaPrincipal).
- [ ] `npx tsc --noEmit` sin errores en archivos modificados.
- [ ] Usuarios regulares (no root) no ven cambios en su flujo de navegación.

---

## 6. Implementation Notes & Constraints

### Patterns to Follow

- El control bar usa `window.location.href` (no React Router `navigate`) para forzar full page
  reload y re-inicializar `TenantProvider` con el nuevo slug.
- Antes de `window.location.href = '/admin'`, llamar `clearDevTenantSlug()` para limpiar el
  `sessionStorage` del tenant dev (`?box=`).
- La migración SQL debe usar `DO $$ BEGIN IF EXISTS ... END IF; END $$;` para ser idempotente
  (igual que las migraciones previas del proyecto).
- `buildTenantUrl(slug)` en `tenant.ts` ya gestiona dev (query param) vs prod (subdomain).
- El dropdown de boxes debe tener `max-h-60 overflow-y-auto` si hay muchos boxes.

### Known Risks / Gotchas

- **Stale `currentBox` para root**: `currentBox` se fija en `fetchProfile` usando `tenantBoxId`.
  Si root navega via React Router (sin full reload), `tenantBoxId` es el mismo y `currentBox`
  no cambia. Por eso el control bar SIEMPRE usa `window.location.href` — fuerza re-inicialización.
- **RLS para INSERT/UPDATE/DELETE**: Esta spec solo añade bypass SELECT. Las operaciones de
  escritura del root en tablas de tenants quedan con las políticas existentes.
- **Boxes sin datos seed**: En dev, algunos boxes (arena, boxtext) pueden no tener datos seed.
  Root verá 0 para esos, lo cual es correcto.

### External Dependencies

| Package | Version | Reason |
|---|---|---|
| `lucide-react` | ya instalado | Iconos: `ArrowLeft`, `Building2`, `ChevronDown` |
| `@supabase/supabase-js` | ya instalado | Query de boxes para el dropdown |

---

## 7. Open Questions

- [ ] ¿El RootControlBar debe aparecer en mobile (sidebar abierto) o solo en desktop? — *Owner: Cesar*
- [ ] En producción, cambiar de box ¿abre en la misma pestaña o nueva? — *Owner: Cesar*
  (brainstorm recomienda misma pestaña para evitar proliferación de pestañas)
- [ ] ¿Root necesita bypass SELECT también en `memberships`? (tabla no en 20260219 migration) — *Owner: Dev*

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-03-06 | Cesar Armas / claude-sonnet-4-6 | Initial draft from brainstorm |
