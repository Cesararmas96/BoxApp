# Brainstorm: Root Navigation & Box Inspector

**Date**: 2026-03-06
**Author**: Cesar Armas
**Status**: exploration
**Recommended Option**: A

---

## Problem Statement

El usuario `root@test.com` (super-admin de la plataforma Boxora) no puede inspeccionar
los datos de los boxes de forma efectiva:

1. **Sin "volver atrás"**: Cuando root visita un box (`/dashboard?box=slug`), no hay ningún
   botón o link para volver al panel de administración (`/admin`). Tiene que cerrar la pestaña
   o escribir la URL manualmente.

2. **Sin selector de box**: Desde el dashboard de un box, root no puede cambiar al dashboard
   de otro box sin abrir una nueva pestaña. Esto crea un flujo roto — varias pestañas abiertas
   sin contexto claro de cuál es cuál.

3. **Datos en cero**: Las tablas `wods`, `invoices`, `sessions`, `bookings`, `leads`, `results`,
   `profiles` (en algunas queries) NO tienen política `is_super_admin()` en su RLS. La función
   `current_user_box_id()` retorna el box_id del PERFIL del root (CrossFit Beta), no el box
   visitado. Las queries con `.eq('box_id', visitedBox.id)` chocan con el filtro RLS y retornan
   0 resultados, aunque el query param sea correcto.

   Ejemplo del conflicto:
   ```
   Query:   SELECT ... FROM wods WHERE box_id = 'principal-id'   (query filter)
   RLS:     AND box_id = 'crossfit-beta-id'                       (current_user_box_id())
   Result:  0 rows                                                 ← bug
   ```

**Usuario afectado**: Exclusivamente `root@test.com` — el operador de Boxora que necesita
dar soporte y auditar boxes sin acceso a datos reales.

---

## Constraints & Requirements

- No romper el flujo de navegación de usuarios regulares (admin, coach, athlete).
- La solución no debe requerir re-login ni cambio de sesión.
- El root debe poder distinguir visualmente que está "inspeccionando" un box, no operándolo.
- Las modificaciones de RLS deben ser aditivas (no modificar policies existentes de usuarios regulares).
- Compatible con el patrón existente: `getTenantSlug()` via `?box=` en dev, subdomain en prod.
- Sin nuevas dependencias de terceros si es posible.

---

## Options Explored

### Option A: Root Control Bar + RLS Superadmin Bypass

Un banner/barra persistente en el `MainLayout` visible solo cuando `isRoot === true`.
Muestra el box actual que se está inspeccionando, un botón "← Panel Admin" para volver,
y un dropdown para cambiar de box directamente. Complementado por una migración SQL que
agrega `is_super_admin()` bypass a todas las tablas de datos del box.

✅ **Pros:**
- UX natural: root siempre sabe qué box está viendo y puede volver con 1 click.
- Selector de box integrado: no necesita abrir nuevas pestañas.
- Datos reales visibles: el bypass RLS muestra lo que el admin del box ve.
- Impacto mínimo en usuarios regulares (el control bar es invisible para no-root).
- Reutiliza `MainLayout.tsx`, `SuperAdmin.tsx`, `AuthContext.isRoot`.

❌ **Cons:**
- Requiere migración SQL (añadir `is_super_admin()` a N tablas).
- El control bar ocupa espacio vertical en el layout.
- Root con muchos boxes puede tener un dropdown largo.

📊 **Effort:** Medium

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `lucide-react` (ya instalado) | Iconos para el control bar | ArrowLeft, Building2 |
| `@supabase/supabase-js` (ya instalado) | Query de boxes para el dropdown | SELECT id, name, slug |

🔗 **Existing Code to Reuse:**
- `src/layouts/MainLayout.tsx` — agregar Root Control Bar sobre el header o dentro del sidebar
- `src/pages/SuperAdmin.tsx` — lista de boxes ya disponible, reutilizar para el dropdown
- `src/contexts/AuthContext.tsx` — `isRoot` ya exportado
- `src/utils/tenant.ts` — `buildTenantUrl(slug)` para navegar entre boxes
- `supabase/migrations/20260219_superadmin_rls.sql` — patrón exacto a replicar en otras tablas

---

### Option B: Box Inspector Panel en /admin (sin salir del panel)

En lugar de enviar a root al dashboard del box, agregar un panel lateral (Sheet/Drawer) en
`/admin` que muestra un resumen de los datos del box seleccionado: miembros activos, WOD del
día, últimos resultados. Root nunca sale del `/admin`. El inspector usa queries privilegiadas
o RPC functions que bypasean RLS.

✅ **Pros:**
- Root nunca sale del contexto `/admin` — navegación clara, sin confusión.
- No contamina `MainLayout` con lógica de root.
- El inspector puede tener una UI propia más enfocada (no el dashboard completo).

❌ **Cons:**
- Root no ve EXACTAMENTE lo que el admin del box ve (UI diferente).
- Requiere crear componentes nuevos para el inspector (no reutiliza el dashboard existente).
- El panel puede quedarse corto si root necesita navegar a `/members`, `/wods`, etc. del box.
- RPC functions o bypass requieren más trabajo en backend que una simple migración RLS.

📊 **Effort:** High

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `@radix-ui/react-dialog` (ya instalado vía shadcn) | Sheet/Drawer para el inspector | |

🔗 **Existing Code to Reuse:**
- `src/components/admin/KpiCard.tsx` — métricas en el panel inspector
- `src/components/admin/AlertsPanel.tsx` — alertas del box
- `src/pages/SuperAdmin.tsx` — trigger del panel desde la card del box

---

### Option C: Box Switcher Global (Tenant Context como estado)

Mover la resolución del tenant de `window.location` a un estado React global controlable.
Root puede cambiar de box desde cualquier pantalla via un selector global sin necesidad de
cambiar la URL. El `TenantProvider` expone un `setActiveTenant(slug)` que actualiza el
contexto en memoria. La URL puede reflejar el cambio opcionalmente.

✅ **Pros:**
- La navegación más fluida: cambio instantáneo sin recarga de página.
- Podría escalar para otros casos (e.g., usuarios con acceso a múltiples boxes).
- Sin dependencia de URL params — limpio para prod con subdominios.

❌ **Cons:**
- Requiere refactorizar `TenantContext` significativamente (estado controlable vs. derivado de URL).
- Rompe el principio actual: "el tenant se deriva de la URL, siempre". Introduce estado mutable.
- La URL y el estado podrían desincronizarse (deep-link, refresh, compartir URL falla).
- Alto riesgo de regresión en el flujo de usuarios regulares.
- Requiere también el RLS bypass (mismo problema que Option A).

📊 **Effort:** High

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| Ninguna nueva | Refactor interno | |

🔗 **Existing Code to Reuse:**
- `src/contexts/TenantContext.tsx` — refactorizar para aceptar slug controlable
- `src/utils/tenant.ts` — adaptar `getTenantSlug()` para aceptar override

---

## Recommendation

**Option A** es la recomendada porque:

- Resuelve AMBOS problemas con el menor riesgo: UX (Root Control Bar) + datos (RLS migration).
- Reutiliza todos los componentes existentes sin refactorizaciones de arquitectura.
- La migración SQL es aditiva y segura: agregar `is_super_admin() OR ...` a políticas existentes
  no cambia el comportamiento para usuarios normales.
- La Root Control Bar es completamente invisible para no-root (`if (!isRoot) return null`).
- Option B no permite a root ver la app como la ve el box admin. Option C es sobreingeniería
  para un caso de uso que solo afecta a un usuario (root).

Trade-offs aceptados:
- El root verá datos reales de cualquier box (privacidad entre tenants no aplica para el operador).
- El control bar agrega ~40px al layout — solo visible para root, aceptable.

---

## Feature Description

### User-Facing Behavior

**Root Control Bar** (visible solo para `isRoot === true`):

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Panel Admin    👁 Inspeccionando: AreaPrincipal  [▼ cambiar] │
└─────────────────────────────────────────────────────────────────┘
```

- Aparece como una barra fija en la parte superior del `MainLayout`, sobre el header normal.
- Color diferenciado (ej. fondo `bg-amber-500/10 border-amber-500/30`) para indicar modo inspector.
- **Botón "← Panel Admin"**: navega a `window.location.href = '/admin'` (full reload para limpiar el tenant context).
- **Label "Inspeccionando: {boxName}"**: muestra el nombre del box actual desde `currentBox?.name`.
- **Dropdown "cambiar"**: lista todos los boxes (query `SELECT id, name, slug FROM boxes`) y al seleccionar uno navega a `window.location.href = '/dashboard?box={slug}'`.
- En producción: el botón "cambiar box" abre el subdominio correspondiente en la misma pestaña (`window.location.href = 'https://{slug}.boxora.website/dashboard'`).

**Datos correctos en el dashboard**:
- Después de la migración RLS, el root verá los datos reales del box visitado en todas las páginas
  (Dashboard, Members, WODs, Leads, Analytics, Billing, etc.).

### Internal Behavior

**Root Control Bar:**
1. `MainLayout` comprueba `isRoot` del `AuthContext`.
2. Si `isRoot === true`, renderiza el control bar sobre el header existente.
3. El control bar fetches `SELECT id, name, slug FROM boxes ORDER BY name` con el cliente Supabase
   (la política RLS de `boxes` ya permite a root ver todos).
4. Al cambiar de box: `window.location.href` con la nueva URL — fuerza full page reload, limpia
   session storage, y re-inicializa `TenantProvider` con el nuevo slug.
5. Al volver a admin: `window.location.href = '/admin'` — limpia el `?box=` de sessionStorage
   (el signOut ya lo hace pero aquí no hay signOut, se puede llamar `clearDevTenantSlug()` antes).

**RLS Superadmin Bypass (migración):**
- Nueva migración que extiende las políticas SELECT de: `wods`, `sessions`, `bookings`, `results`,
  `invoices`, `leads`, `audit_logs`, `memberships`, `plans`, `competitions`, `roles` (todas las
  tablas con políticas `box_id = current_user_box_id()`).
- Patrón a aplicar a cada tabla:
  ```sql
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.{table};
  CREATE POLICY "tenant_isolation_select" ON public.{table}
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  ```
- La función `is_super_admin()` ya existe en la DB (migración 20260219).

### Edge Cases & Error Handling

- **Root en página sin tenant** (`/admin`, sin `?box=`): `currentBox = null`, el control bar
  muestra "Sin box seleccionado" y oculta el label de box name.
- **Box suspendido**: con el fix previo (TASK-021), `isSuspended && !isRoot` ya permite al root
  ver boxes suspendidos. El control bar muestra un badge "Suspendido".
- **Root cierra la pestaña**: al navegar con `window.location.href` al control bar, el sessionStorage
  se actualiza en la misma pestaña. No hay pestañas huérfanas.
- **Muchos boxes (> 20)**: el dropdown del box switcher debe tener `max-height` con scroll o
  un campo de búsqueda inline para no ser inutilizable.
- **Prod vs Dev**: `buildTenantUrl(slug)` en `tenant.ts` ya maneja ambos entornos correctamente.
  El control bar puede usarlo directamente.

---

## Capabilities

### New Capabilities
- `root-control-bar`: Banner persistente en MainLayout para root — navegación entre boxes y retorno a admin.
- `superadmin-rls-all-tables`: Bypass `is_super_admin()` en todas las tablas de datos de boxes.

### Modified Capabilities
- `multi-tenant-platform` (spec: `sdd/specs/multi-tenant-platform.spec.md`): El root user ahora
  puede inspeccionar cualquier box con datos completos y tiene UX de navegación adecuada.

---

## Impact & Integration

| Affected Component | Impact Type | Notes |
|---|---|---|
| `src/layouts/MainLayout.tsx` | extends | Agregar Root Control Bar condicional |
| `supabase/migrations/` | new migration | RLS bypass para todas las tablas de datos |
| `src/utils/tenant.ts` | minor | `clearDevTenantSlug()` llamado al volver a /admin |
| `src/contexts/AuthContext.tsx` | none | `isRoot` ya disponible, no requiere cambios |
| `src/pages/SuperAdmin.tsx` | minor | Opcional: mejorar display del botón "Visitar Box" |

---

## Open Questions

- [ ] ¿El Root Control Bar debe aparecer también en mobile (sidebar abierto) o solo en desktop? — *Owner: Cesar*
- [ ] ¿Cuántas tablas exactamente tienen RLS que necesita bypass? Verificar con `SELECT tablename FROM pg_policies WHERE policyname LIKE '%tenant_isolation%'` — *Owner: Dev*
- [ ] ¿El root también necesita permisos de INSERT/UPDATE/DELETE en las tablas de datos de box? Por ahora solo SELECT (modo inspector read-only). — *Owner: Cesar / Product*
- [ ] Al "volver a /admin" desde una pestaña, ¿debe el `sessionStorage` limpiar automáticamente el tenant slug? `clearDevTenantSlug()` existe en `tenant.ts` pero hay que invocarlo antes del `window.location.href`. — *Owner: Dev*
- [ ] En producción, el Root Control Bar para cambiar de box ¿abre en la misma pestaña (pierde contexto) o en nueva (multiplica pestañas)? — *Owner: Cesar*
