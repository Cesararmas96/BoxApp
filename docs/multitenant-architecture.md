# Arquitectura Multi-Tenant — BoxApp / Boxora

**Versión:** 1.0
**Fecha:** 2026-03-03
**Spec de referencia:** `sdd/specs/multi-tenant-platform.spec.md` (FEAT-001)

---

## 1. Visión General

Boxora es una plataforma SaaS donde cada **Box** (gimnasio CrossFit) es un tenant independiente. La isolación de datos, branding y acceso es total entre tenants: un usuario del Box A nunca puede ver ni modificar datos del Box B.

```
boxora.website              ← dominio principal (SuperAdmin)
  ├── crossfit-arena.boxora.website   ← Box A (tenant)
  ├── crossfit-beta.boxora.website    ← Box B (tenant)
  └── <slug>.boxora.website           ← cualquier box registrado
```

En **desarrollo local** el tenant se simula con un query param:
```
http://localhost:5173/?box=crossfit-beta
```

---

## 2. Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                         Browser                          │
│                                                          │
│  URL / hostname                                          │
│       │                                                  │
│       ▼                                                  │
│  getTenantSlug() ──────── sessionStorage (dev fallback)  │
│       │                                                  │
│       ▼                                                  │
│  TenantProvider                                          │
│    → fetch anon: boxes WHERE slug = ?                    │
│    → estado: tenantBox, isSuspended, tenantNotFound      │
│       │                                                  │
│       ▼                                                  │
│  AuthProvider (recibe tenantBoxId)                       │
│    → signIn / signUp con box_id inyectado                │
│    → carga profile + box settings                        │
│       │                                                  │
│       ▼                                                  │
│  AppContent                                              │
│    → renderiza rutas protegidas por rol                  │
└─────────────────────────────────────────────────────────┘
         │  todas las queries
         ▼
┌─────────────────────────────────────────────────────────┐
│                     Supabase                             │
│                                                          │
│  RLS Policies ─────────────────────────────────────────  │
│    current_user_box_id()  →  profiles.box_id WHERE      │
│                               id = auth.uid()            │
│                                                          │
│  is_super_admin()  →  email = 'root@test.com'           │
│                        OR jwt.user_metadata.is_root      │
│                                                          │
│  is_tenant_active()  →  boxes.subscription_status       │
│                           IN ('active', 'trial')         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Resolución de Tenant (`src/utils/tenant.ts`)

### Lógica de `getTenantSlug()`

| Entorno | Fuente primaria | Fallback |
|---|---|---|
| **Producción** | Subdominio del hostname | — |
| **Desarrollo** | Query param `?box=<slug>` | `sessionStorage['dev_tenant_slug']` |

El fallback de `sessionStorage` es crítico en desarrollo: cuando React Router navega de `/?box=crossfit-beta` a `/dashboard`, la query param desaparece de la URL pero el tenant persiste en sesión.

```
Primera carga:  /?box=crossfit-beta
  → getTenantSlug() lee URL → 'crossfit-beta'
  → guarda en sessionStorage

Navegación a /dashboard (sin ?box=):
  → getTenantSlug() no encuentra URL param
  → lee sessionStorage → 'crossfit-beta' ✓

Sign-out:
  → clearDevTenantSlug() limpia sessionStorage
  → próximo login empieza limpio
```

### `buildTenantUrl(slug)`

Construye la URL correcta según el entorno:
- **Prod:** `https://{slug}.boxora.website`
- **Dev:** `/?box={slug}`

---

## 4. Ciclo de Vida del Tenant (`subscription_status`)

La tabla `boxes` tiene una columna `subscription_status` de tipo ENUM:

| Status | Descripción | Acceso |
|---|---|---|
| `trial` | Nuevo box auto-registrado | ✅ Completo |
| `active` | Suscripción activa (confirmado por SuperAdmin) | ✅ Completo |
| `suspended` | Suspendido por falta de pago u otro motivo | ❌ Bloqueado — pantalla de suspensión |
| `cancelled` | Cancelado definitivamente | ❌ Bloqueado — pantalla de suspensión |

**Regla de negocio:**
- Boxes creados via `/register` inician en `trial`
- El SuperAdmin cambia el status manualmente desde `/admin`
- Boxes creados antes de la migración `20260302` están en `active`

**Función helper en Supabase:**
```sql
public.is_tenant_active()
-- Retorna TRUE si subscription_status IN ('active', 'trial')
```

---

## 5. Aislamiento de Datos — RLS (Row Level Security)

Todas las tablas con datos de negocio tienen RLS habilitado. El aislamiento se basa en dos funciones SQL:

### `public.current_user_box_id()`
```sql
SELECT box_id FROM public.profiles WHERE id = auth.uid()
```
Retorna el `box_id` del usuario autenticado. Es el ancla de todas las políticas.

### `public.is_super_admin()`
```sql
SELECT (auth.email() = 'root@test.com')
    OR COALESCE((auth.jwt()->'user_metadata'->>'is_root')::boolean, false)
```
Permite al superadmin saltarse las restricciones de tenant.

### Política estándar por tabla

```sql
-- SELECT: solo datos del propio box
USING (box_id = current_user_box_id())

-- INSERT: solo en el propio box
WITH CHECK (box_id = current_user_box_id())

-- UPDATE: mismo box
USING/WITH CHECK (box_id = current_user_box_id())

-- DELETE: mismo box + restricción de rol
USING (box_id = current_user_box_id() AND role_id = 'admin')
```

### Tabla de permisos por rol y tabla

| Tabla | athlete | coach | admin | receptionist |
|---|:---:|:---:|:---:|:---:|
| `profiles` | solo propio | SELECT | CRUD | SELECT |
| `wods` | SELECT | SELECT + INSERT/UPDATE | CRUD | — |
| `memberships` | solo propia | SELECT | CRUD | CRUD |
| `plans` | SELECT | SELECT | CRUD | SELECT |
| `expenses` | ❌ | ❌ | CRUD | CRUD |
| `leads` | ❌ | SELECT | CRUD | CRUD |
| `invoices` | solo propias | ❌ | CRUD | CRUD |
| `boxes` | ❌ | ❌ | UPDATE (propio) | ❌ |

**Excepción `boxes`:**
```sql
-- SELECT: superadmin ve todo, usuarios solo su box
USING (is_super_admin() OR id = current_user_box_id())

-- INSERT: solo superadmin puede crear boxes
WITH CHECK (is_super_admin())

-- anon puede leer boxes (necesario para login por slug)
CREATE POLICY "anon_select_by_slug" FOR SELECT TO anon USING (true)
```

---

## 6. Roles del Sistema

| `role_id` | Descripción |
|---|---|
| `athlete` | Miembro del box. Ve su perfil, WODs, benchmarks, competencias. |
| `coach` | Instructor. Gestiona WODs, ve miembros, accede a competencias. |
| `admin` | Dueño / administrador del box. Acceso total al box. |
| `receptionist` | Recepcionista. Gestiona membresías, facturación, leads. |
| `root` | SuperAdmin de Boxora. Acceso global a todos los boxes. Identificado por email `root@test.com` o metadata `is_root: true`. |

---

## 7. Flujo de Autenticación

### Login normal (email + password)
```
1. Usuario en {slug}.boxora.website/login
2. TenantProvider ya tiene el box cargado (fetch anon por slug)
3. AuthProvider recibe tenantBoxId del TenantProvider
4. signIn() → supabase.auth.signInWithPassword()
5. fetchProfile(userId):
   a. SELECT * FROM profiles WHERE id = userId
   b. Si profile.box_id ≠ tenantBoxId → UPDATE profiles SET box_id = tenantBoxId
   c. SELECT * FROM boxes WHERE id = profile.box_id
6. AppContent renderiza dashboard con datos del box correcto
```

### Google OAuth
```
1. signInWithGoogle() guarda tenantBoxId en localStorage['pending_box_id']
2. Redirige a Google → callback en /auth/callback
3. fetchProfile() lee 'pending_box_id' y reconcilia el box_id
4. localStorage['pending_box_id'] eliminado
```

### Reconciliación de box_id
Si un usuario existe pero su `profile.box_id` no coincide con el tenant actual (ej: OAuth desde un subdomain nuevo), el sistema actualiza el `box_id` automáticamente. Esto permite que el auto-registro funcione incluso con Google OAuth.

---

## 8. Auto-Registro de Box (`/register`)

El wizard de 2 pasos en `/register` (accesible desde el main domain):

```
Paso 1: Datos del box
  - Nombre del box
  - Slug (validación de disponibilidad en tiempo real)
  - País

Paso 2: Cuenta de administrador
  - Email
  - Contraseña

Resultado:
  → INSERT INTO boxes (name, slug, country, subscription_status='trial')
  → supabase.auth.signUp({ email, password, data: { box_id } })
  → INSERT INTO profiles (id, role_id='admin', box_id)
  → Redirige a {slug}.boxora.website/dashboard
```

---

## 9. Panel SuperAdmin (`/admin`)

Accesible solo para `root@test.com` desde el main domain `boxora.website`.

Permite:
- Ver todos los boxes registrados
- Cambiar `subscription_status` de cualquier box
- Ver métricas globales

**Acceso URL desarrollo:** `http://localhost:5173/admin` (sin `?box=`, logueado como root)

---

## 10. Entorno de Desarrollo — Setup Completo

### Variables de entorno (`.env`)
```env
VITE_SUPABASE_URL=https://uvnqsamswfmrfxedawko.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

### Tenants disponibles

#### Box A — CrossFit Arena (datos de seed)
| Campo | Valor |
|---|---|
| Box ID | `fd14f401-d8a0-4ec3-b36e-e1c74676ab9e` |
| URL dev | `http://localhost:5173/?box=<slug-de-box-a>` |
| Admin | `silvia.rodriguez.45@example.com` |
| Datos | 40 atletas, 5 coaches, 5 planes — seed completo |

#### Box B — CrossFit Beta (tenant de prueba)
| Campo | Valor |
|---|---|
| Box ID | `bbbbbbbb-0000-4000-a000-000000000001` |
| Slug | `crossfit-beta` |
| URL dev | `http://localhost:5173/?box=crossfit-beta` |
| Status | `active` |

| Email | Password | Rol |
|---|---|---|
| `admin@boxb.test` | `Admin1234!` | admin |
| `coach@boxb.test` | `Coach1234!` | coach |
| `athlete@boxb.test` | `Athlete1234!` | athlete |

#### SuperAdmin
| Email | Password |
|---|---|
| `root@test.com` | *(ver 1Password / env seguro)* |
| URL dev | `http://localhost:5173/` (sin `?box=`) |

---

## 11. Checklist de Validación

### A. Resolución de tenant
- [ ] `/?box=crossfit-beta` carga "CrossFit Beta" en el título
- [ ] `/?box=slug-invalido` muestra pantalla "Box no encontrado"
- [ ] Navegar a `/dashboard` y hacer refresh mantiene el tenant (sessionStorage)
- [ ] Sign-out y volver a `/?box=crossfit-beta` carga el tenant limpio

### B. Autenticación y roles
- [ ] Login con `admin@boxb.test` en `/?box=crossfit-beta` → accede
- [ ] Login con usuario de Box A en `/?box=crossfit-beta` → error o redirect
- [ ] Login con `root@test.com` en `/` (sin box) → panel SuperAdmin

### C. Aislamiento de datos (RLS)
- [ ] Admin de Box B **no ve** los 40 miembros de Box A en `/members`
- [ ] Admin de Box B **no ve** los gastos de Box A en `/billing`
- [ ] Admin de Box A **no ve** datos de Box B
- [ ] Athlete de Box B **no accede** a `/members` (403/redirect)

### D. Lifecycle del tenant
- [ ] Desde SuperAdmin: cambiar Box B a `suspended`
- [ ] Ir a `/?box=crossfit-beta` → pantalla de suspensión (bloqueado)
- [ ] Desde SuperAdmin: reactivar Box B a `active`
- [ ] Ir a `/?box=crossfit-beta` → acceso restaurado

### E. Auto-registro
- [ ] Ir a `http://localhost:5173/register`
- [ ] Completar wizard con slug único
- [ ] Box creado con `subscription_status = 'trial'`
- [ ] Redirige al dashboard del nuevo box

---

## 12. Bugs Conocidos y Fixes Aplicados

### BUG-001: Pérdida de tenant en dev tras navegación
**Síntoma:** Acceder a `/dashboard` directamente o hacer refresh perdía el tenant (pantalla de login sin box).
**Causa:** `getTenantSlug()` leía `window.location.search` solo en el momento del render; React Router elimina `?box=` al navegar.
**Fix:** `sessionStorage` como fallback en `getTenantSlug()`. El slug se persiste al primer load y se limpia en sign-out.
**Archivo:** `src/utils/tenant.ts`

### BUG-002: Contraseñas inválidas en usuarios creados via SQL directo
**Síntoma:** Login con usuarios de test retornaba "Invalid login credentials".
**Causa:** `gen_salt('bf')` sin argumento usa cost factor **6** (`$2a$06$`). Supabase GoTrue requiere cost factor **10** (`$2a$10$`).
**Fix:** Usar `gen_salt('bf', 10)` explícito en todos los scripts SQL y en la función `admin_reset_password()`.
**Archivos afectados:**
- `supabase/migrations/20260215_admin_reset_password.sql`
- `supabase/migrations/20260219_rls_multi_tenant_isolation.sql`
- Función `public.admin_reset_password()` actualizada en producción

---

## 13. Migraciones Relacionadas

| Archivo | Descripción |
|---|---|
| `20260219_rls_multi_tenant_isolation.sql` | RLS en todas las tablas de negocio. Función `current_user_box_id()`. |
| `20260219_superadmin_rls.sql` | Políticas especiales para `boxes`: superadmin bypass + anon read. Función `is_super_admin()`. |
| `20260302_add_subscription_status.sql` | ENUM `subscription_status_type`. Columna en `boxes`. Función `is_tenant_active()`. |
| `20260215_admin_reset_password.sql` | Función `admin_reset_password()` — requiere `gen_salt('bf', 10)`. |

---

## 14. Scripts de Utilidad

| Script | Propósito |
|---|---|
| `scripts/seed_test_box_b.sql` | Crea Box B con planes, membresía y gasto de prueba. Requiere auth users ya creados. |
| `supabase/migrations/*.sql` | Todas las migraciones son idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`). |
