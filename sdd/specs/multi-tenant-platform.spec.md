# Feature Specification: Multi-Tenant Platform (Boxora)

**Feature ID**: FEAT-001
**Date**: 2026-03-02
**Author**: Cesar Armas
**Status**: approved
**Target version**: 1.0.0

---

## 1. Motivation & Business Requirements

### Problem Statement

BoxApp tiene la base técnica de multi-tenancy (tabla `boxes`, RLS por `box_id`, funciones helper en Supabase, panel SuperAdmin), pero carece de un ciclo de vida de tenant completo para operar como producto SaaS:

- **El routing es por path** (`/box/:slug`): URL poco profesional, requiere que los atletas recuerden una ruta específica.
- **No existe auto-registro**: Los dueños de box deben pedirle al super-admin que los cree manualmente — no escala.
- **Sin lifecycle de tenant**: No hay estado de suscripción, ni forma de suspender/reactivar un box desde el panel.
- **El `AuthContext` no inyecta el contexto de tenant desde la URL**: Depende 100% del `profile.box_id` post-login.

**Usuarios afectados:**
- **Box Owners**: Quieren registrar su gym de forma autónoma sin intervención del equipo de Boxora.
- **Super-Admin (Boxora)**: Necesita supervisar tenants, cambiar su estado, y asignar planes manualmente.
- **Atletas y Coaches**: Acceden a su box via una URL limpia (`mibox.boxora.website`) con el branding correcto desde el primer clic.

### Goals

- G1: El routing de tenant cambia de path-based a **subdomain-based** (`{slug}.boxora.website`).
- G2: Un Box Owner puede **registrarse solo** en 2 pasos (datos del box + cuenta de admin).
- G3: El super-admin puede **asignar y cambiar el estado de suscripción** de cualquier box (`active | trial | suspended`).
- G4: Los boxes existentes migran a `subscription_status = 'active'` mediante un script SQL.
- G5: Acceso suspendido muestra página bloqueante al intentar entrar al dashboard.
- G6: La página de login del super-admin en `boxora.website/login` sigue funcionando.
- G7: En entorno de desarrollo (localhost), el tenant se resuelve por query param `?box=<slug>`.

### Non-Goals (explicitly out of scope)

- ❌ Integración con Stripe o cualquier pasarela de pago — el billing es manual.
- ❌ Envío de emails de invitación a miembros.
- ❌ Custom domains por tenant (`app.crossfitarena.com`).
- ❌ Landing page / marketing page en `boxora.website`.
- ❌ Tier freemium — un solo plan de pago gestionado manualmente.
- ❌ Multi-language onboarding (la UI en español es suficiente para el MVP).

---

## 2. Architectural Design

### Overview

El cambio central es **mover la fuente de verdad del tenant de la ruta URL al hostname**. Todo lo demás (RLS, AuthContext, Login con branding) se adapta a este nuevo resolver. Se añade un `subscription_status` a la tabla `boxes` para que el SuperAdmin controle el ciclo de vida.

```
Usuario visita: mibox.boxora.website
       │
       ▼
tenant.ts::getTenantSlug()
  → lee window.location.hostname
  → extrae "mibox"
  → retorna slug
       │
       ▼
TenantProvider (nuevo Context)
  → fetch anon: boxes WHERE slug = "mibox"
  → guarda { box_id, name, slug, branding, subscription_status }
       │
       ├─→ subscription_status === 'suspended'?
       │     └─→ Renderiza <SuspendedScreen />
       │
       └─→ AuthContext (ya existente)
             → signIn/signUp con box_id inyectado
             → perfil cargado, RLS activo
```

### Component Diagram

```
App.tsx
  └── TenantProvider  ← NUEVO: resuelve slug → box
        └── AuthProvider  ← ya existe, recibe tenantBoxId
              └── AppContent
                    ├── <SuspendedScreen />       ← NUEVO
                    ├── Routes (sin /box/:slug)
                    └── /register  ← NUEVO: wizard onboarding
```

```
boxora.website (main domain)
  ├── /login        → Login (super-admin + fallback)
  ├── /register     → RegisterBox wizard  ← NUEVO
  └── /admin        → SuperAdmin panel (extendido)

{slug}.boxora.website (tenant subdomain)
  ├── /login        → Login (con branding del box, box_id inyectado)
  └── /dashboard, /members, ... → App normal
```

### Integration Points

| Existing Component | Integration Type | Notes |
|---|---|---|
| `src/utils/tenant.ts` | modifies | Implementar `getTenantSlug()` desde hostname; mantener dev fallback por `?box=` |
| `src/contexts/AuthContext.tsx` | modifies | Aceptar `tenantBoxId` prop para pre-inyectar box context antes del login |
| `src/pages/Login.tsx` | modifies | Leer `tenantBoxId` desde TenantContext en lugar de `useParams<boxSlug>` |
| `src/App.tsx` | modifies | Eliminar route `/box/:boxSlug`; envolver con `TenantProvider` |
| `src/pages/SuperAdmin.tsx` | extends | Añadir columna `Status`, selector de `subscription_status`, métricas básicas |
| `supabase/migrations/` | extends | Añadir `subscription_status` enum y columna a `boxes` |
| `vercel.json` | modifies | Añadir wildcard rewrite para `*.boxora.website` → misma SPA |

### Data Models

```typescript
// Nuevo campo en tabla boxes (Supabase)
type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

// Extensión del Row de boxes (ya en supabase.ts)
interface BoxRow {
  // ... campos existentes ...
  subscription_status: SubscriptionStatus;  // NUEVO
}

// Nuevo context
interface TenantContextType {
  tenantSlug: string | null;      // "crossfit-arena"
  tenantBox: BoxRow | null;       // datos completos del box
  isTenantSubdomain: boolean;     // false en localhost/main domain
  isLoading: boolean;
}
```

### New Public Interfaces

```typescript
// src/utils/tenant.ts — getTenantSlug() (reemplaza getTenantSlugFromPath)
export function getTenantSlug(): string | null;
// Lógica: subdomain en prod, ?box= query param en dev

// src/contexts/TenantContext.tsx — NUEVO
export const TenantProvider: React.FC<{ children: ReactNode }>;
export const useTenant: () => TenantContextType;

// src/pages/RegisterBox.tsx — NUEVO
export const RegisterBox: React.FC; // wizard 2 pasos
```

---

## 3. Module Breakdown

### Module 1: Tenant Resolver (`tenant.ts`)
- **Path**: `src/utils/tenant.ts`
- **Responsibility**: Extraer el slug del tenant del hostname (prod) o del query param `?box=` (dev). Exportar `buildTenantUrl(slug)` que retorna la URL correcta según el entorno.
- **Depends on**: nada (puro JS)

### Module 2: TenantContext (`TenantContext.tsx`)
- **Path**: `src/contexts/TenantContext.tsx`
- **Responsibility**: Leer el slug via Module 1, hacer un `fetch` anónimo a Supabase para obtener el box completo (incluyendo `subscription_status`). Exponer `tenantBox`, `tenantSlug`, `isTenantSubdomain` via React Context. Si `subscription_status === 'suspended'`, marcar al consumidor para mostrar pantalla bloqueante.
- **Depends on**: Module 1, `supabaseClient`

### Module 3: AuthContext update (`AuthContext.tsx`)
- **Path**: `src/contexts/AuthContext.tsx`
- **Responsibility**: Aceptar `tenantBoxId?: string` como prop del Provider. Si está presente, usarlo como fuente de verdad para el `box_id` en lugar de esperar al profile. Esto permite que el `signUp` en el wizard ya asocie el box correcto.
- **Depends on**: Module 2 (TenantProvider provee el boxId)

### Module 4: App Router update (`App.tsx`)
- **Path**: `src/App.tsx`
- **Responsibility**: Envolver `AuthProvider` con `TenantProvider`. Eliminar la route `/box/:boxSlug`. Añadir route `/register` para el wizard. Renderizar `<SuspendedScreen />` si el tenant está suspendido.
- **Depends on**: Module 2, Module 5

### Module 5: SuspendedScreen (`SuspendedScreen.tsx`)
- **Path**: `src/components/SuspendedScreen.tsx`
- **Responsibility**: Pantalla bloqueante que se muestra cuando `subscription_status === 'suspended'`. Muestra mensaje de contacto con el equipo de Boxora. Permite hacer logout.
- **Depends on**: `useAuth` (para logout)

### Module 6: RegisterBox Wizard (`RegisterBox.tsx`)
- **Path**: `src/pages/RegisterBox.tsx`
- **Responsibility**: Wizard de 2 pasos para auto-registro de un box:
  - **Paso 1**: Nombre del box, slug (auto-generado + validación en tiempo real de unicidad), país.
  - **Paso 2**: Email y contraseña del primer admin.
  - **Éxito**: Crea el box en `boxes`, hace `signUp` en Supabase Auth con `box_id` en metadata, redirige a `{slug}.boxora.website/dashboard`.
- **Depends on**: `supabaseClient`, Module 1 (`buildTenantUrl`)

### Module 7: DB Migration (`subscription_status`)
- **Path**: `supabase/migrations/20260302_add_subscription_status.sql`
- **Responsibility**:
  - Crear el tipo ENUM `subscription_status_type` (`trial`, `active`, `suspended`, `cancelled`).
  - Añadir columna `subscription_status subscription_status_type NOT NULL DEFAULT 'trial'` a `boxes`.
  - Actualizar boxes existentes a `'active'`.
  - Exponer función helper `public.is_tenant_active()` para RLS futuro.
- **Depends on**: nada (SQL puro)

### Module 8: SuperAdmin update (`SuperAdmin.tsx`)
- **Path**: `src/pages/SuperAdmin.tsx`
- **Responsibility**: Añadir columna de estado (`subscription_status`) en la lista de boxes con badge visual. Añadir selector para cambiar el estado desde el card (dropdown: Trial / Active / Suspended). Actualizar `supabase.from('boxes').update(...)` para persistir el cambio.
- **Depends on**: Module 7 (columna en DB)

### Module 9: Vercel + DNS config
- **Path**: `vercel.json`
- **Responsibility**: Asegurar que el rewrite SPA (`/*` → `index.html`) aplica también en subdominio wildcard. Documentar los pasos de configuración en Namecheap + Vercel.
- **Depends on**: nada

### Module 10: Login update (`Login.tsx`)
- **Path**: `src/pages/Login.tsx`
- **Responsibility**: Reemplazar `useParams<{ boxSlug }>` por `useTenant()` para obtener el branding del box. En subdominio de tenant, el box ya está cargado sin necesidad de hacer un fetch extra.
- **Depends on**: Module 2

---

## 4. Test Specification

### Unit Tests (manual/visual — no test runner configurado)

| Test | Module | Description |
|---|---|---|
| `getTenantSlug - subdomain` | Module 1 | Con hostname `mibox.boxora.website` retorna `"mibox"` |
| `getTenantSlug - localhost` | Module 1 | Con `localhost?box=mibox` retorna `"mibox"` |
| `getTenantSlug - main domain` | Module 1 | Con `boxora.website` retorna `null` |
| `buildTenantUrl - prod` | Module 1 | Retorna `https://mibox.boxora.website` |
| `buildTenantUrl - dev` | Module 1 | Retorna `/?box=mibox` (o similar) |
| `slug validation - unique` | Module 6 | Slug ya existente muestra error inline |
| `slug validation - format` | Module 6 | Caracteres inválidos son auto-corregidos |
| `suspended tenant screen` | Module 5 | Box con `status = suspended` muestra SuspendedScreen |

### Integration Tests (manual, end-to-end)

| Test | Description |
|---|---|
| `Full onboarding flow` | Registro en `/register` → box creado en DB → redirect a subdominio → login exitoso → dashboard visible |
| `Super-admin suspend + access` | SuperAdmin cambia status a `suspended` → tenant intenta entrar → ve SuspendedScreen |
| `Super-admin reactivate` | SuperAdmin cambia a `active` → tenant entra normalmente |
| `Existing box login via subdomain` | Box existente con slug `crossfit-demo` → `crossfit-demo.boxora.website/login` → branding correcto |
| `Super-admin login on main domain` | `boxora.website/login` → login como root → redirige a `/admin` |

---

## 5. Acceptance Criteria

> Esta feature está completa cuando TODOS los siguientes criterios son verdaderos:

- [ ] `{slug}.boxora.website` carga la app con el branding correcto del box sin ningún path `/box/` en la URL.
- [ ] `boxora.website/register` permite crear un nuevo box en 2 pasos sin intervención del super-admin.
- [ ] El slug es validado en tiempo real (unicidad + formato) antes de permitir continuar.
- [ ] Al completar el registro, el usuario es redirigido a `{slug}.boxora.website/dashboard` como admin.
- [ ] El super-admin puede cambiar `subscription_status` de cualquier box desde el panel.
- [ ] Un box con `subscription_status = 'suspended'` muestra `SuspendedScreen` en lugar del dashboard.
- [ ] Los boxes existentes tienen `subscription_status = 'active'` después de la migración.
- [ ] `boxora.website/login` sigue funcionando para el super-admin.
- [ ] En localhost, el tenant se resuelve con el query param `?box=<slug>`.
- [ ] El RLS de Supabase sigue funcionando: un usuario de box A no ve datos de box B.
- [ ] `tenant.ts` es el único archivo que contiene lógica de resolución de tenant.

---

## 6. Implementation Notes & Constraints

### Patterns to Follow

- **React Context pattern**: `TenantContext` sigue el mismo patrón que `AuthContext` (Provider + hook `useTenant`).
- **Supabase anon key para branding**: El fetch del box en `TenantProvider` usa la anon key (el box name/logo son públicos por diseño — RLS permite SELECT anon en `boxes`).
- **Orden de wrappers**: `TenantProvider` envuelve a `AuthProvider`. El `tenantBox` debe estar disponible antes del login.
- **Cambios mínimos en AuthContext**: Solo se añade el prop `tenantBoxId?: string` al Provider — no se refactoriza la lógica interna.
- **SPA routing**: Vercel ya tiene el rewrite `/*` → `index.html`. El wildcard de subdominio es una configuración adicional en el dashboard de Vercel (no en `vercel.json`).

### Known Risks / Gotchas

- **CORS en subdominio**: Supabase debe aceptar requests desde `*.boxora.website`. Verificar en `Project Settings > API > CORS`.
- **Namecheap wildcard DNS**: El registro `*.boxora.website` tarda entre 30 min y 24h en propagarse. Documentarlo.
- **Vercel free plan + wildcard**: Vercel soporta wildcards en el plan Hobby, pero requiere verificar el dominio. Un solo deployment sirve todos los subdominios.
- **OAuth redirect URIs**: `signInWithGoogle` redirige a `/auth/callback`. En subdominio, el redirect_uri cambia. Debe añadirse `https://*.boxora.website/auth/callback` en Supabase Auth settings (o manejar con el dominio principal).
- **TypeScript types**: La columna `subscription_status` no está en `supabase.ts`. Hay que sincronizar los tipos tras la migración (Módulo 7) o hacer cast manual con `as any` provisionalmente.
- **Trigger de nuevo usuario**: El trigger existente de Supabase que crea el `profile` al hacer `signUp` debe recibir `box_id` desde los `user_metadata`. Verificar que el trigger ya lee `raw_user_meta_data->>'box_id'`.

### External Dependencies

| Package | Version | Reason |
|---|---|---|
| Ninguna nueva | — | El stack existente es suficiente |

### Infra / DNS Setup (one-time, fuera del código)

1. **Namecheap**: Añadir registro CNAME `*` → `cname.vercel-dns.com` (o A record si Vercel lo requiere).
2. **Vercel Dashboard**: En el proyecto, ir a Domains → Añadir `*.boxora.website` → Verificar.
3. **Supabase**: En Auth → URL Configuration → Añadir `https://*.boxora.website` como site URL adicional (o allowlist).

---

## 7. Open Questions

> Resueltas desde el brainstorm:

- [x] ¿El plan freemium existe? → **No. Un solo plan de pago, gestionado manualmente por el super-admin.**
- [x] ¿Los boxes existentes? → **Migración SQL los marca como `subscription_status = 'active'`.**
- [x] ¿Vercel wildcard en plan gratuito? → **Sí, Vercel Hobby soporta wildcard. Dominio en Namecheap.**
- [x] ¿Emails de invitación? → **Out of scope por ahora. No se implementa.**
- [x] ¿Login en main domain para super-admin? → **Sí. `boxora.website/login` sigue activo.**
- [x] ¿Landing page en main domain? → **Out of scope por ahora.**

> Pendientes:

- [ ] ¿El trigger `handle_new_user` en Supabase ya lee `box_id` de `user_metadata`? Verificar en Supabase Dashboard → SQL Editor. — *Owner: Dev*
- [ ] ¿Qué muestra `boxora.website/` (root, main domain, sin subdominio)? ¿Redirect a `/login` o a `/register`? — *Owner: Product* Es login del superuser para poder configurar los demas box o administrar tareas
- [ ] ¿El OAuth de Google debe funcionar en los subdominios de tenant? — *Owner: Dev* SI

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-03-02 | Agent | Initial draft desde brainstorm `multi-tenant-platform.brainstorm.md` |
