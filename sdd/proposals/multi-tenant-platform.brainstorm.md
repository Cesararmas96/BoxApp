# Brainstorm: Multi-Tenant Platform (Boxora)

**Date**: 2026-03-02
**Author**: Agent
**Status**: exploration
**Recommended Option**: B

---

## Problem Statement

BoxApp tiene la base técnica de multi-tenancy (tabla `boxes`, RLS por `box_id`, panel SuperAdmin), pero carece de un ciclo de vida de tenant completo para ser un producto SaaS maduro. Actualmente:

- El enrutamiento es por path (`/box/:slug`) — no por subdominio.
- No existe un flujo de auto-registro para un nuevo dueño de box.
- No hay subscripción o billing por tenant conectado a un proveedor de pago.
- El SuperAdmin crea boxes manualmente, lo que no escala.
- Los nuevos tenants no tienen un proceso de onboarding guiado (branding, primer admin, etc.).

**Usuarios afectados:**
- **Dueños de box/gym** que quieren contratar la plataforma sin intervención manual.
- **Super-admin (Boxora team)** que necesita gestionar tenants y ver métricas cross-tenant.
- **Atletas y coaches** que acceden siempre al contexto de su box.

**Por qué ahora:** La infraestructura está lista (RLS, `boxes` table, AuthContext con `currentBox`). El siguiente paso natural es cerrar el ciclo de negocio: onboarding → configuración → billing → operación.

---

## Constraints & Requirements

- **Aislamiento total de datos**: RLS en Supabase ya cubre esto; no debe romperse.
- **Sin migración destructiva**: Cualquier cambio debe ser aditivo (nuevas tablas, nuevas columnas nullable).
- **Branding por tenant**: Logo, fondo de login, colores — ya existe en `boxes`.
- **React + Vite (SPA)**: No es SvelteKit; la navegación es client-side con React Router.
- **Supabase como backend**: Auth, DB y Storage ya están configurados.
- **Vercel para deploy**: El `vercel.json` ya existe; soporte de rewrites para subdominio debe evaluarse.
- **i18n activo**: `i18next` está configurado; formularios de onboarding deben soportar español.
- **Sin cambio de modelo de datos core**: `profiles.box_id` y `boxes.slug` son la columna vertebral.

---

## Options Explored

### Option A: Path-Based + Provisioning Manual Mejorado

Mantener `/box/:slug` como estrategia de routing. Mejorar el panel SuperAdmin con un flujo de onboarding guiado (wizard) para que el super-admin configure cada box. No hay auto-registro; el dueño del box solicita acceso y el team de Boxora lo activa.

✅ **Pros:**
- Cambios mínimos en infraestructura (sin DNS/Vercel rewrites).
- Más fácil de depurar en desarrollo (todo en localhost sin subdominio).
- Control total sobre qué boxes existen (previene spam).
- El routing ya funciona — `/box/crossfit-arena` ya está en App.tsx.

❌ **Cons:**
- No escala: el super-admin debe crear cada box manualmente.
- URL poco profesional: `boxora.website/box/crossfit-arena` vs `crossfit-arena.boxora.website`.
- Sin billing automático — el revenue collection es manual.
- Sin onboarding de auto-servicio para el dueño del box.

📊 **Effort:** Low

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| Ninguna nueva | — | Reutiliza stack existente |

🔗 **Existing Code to Reuse:**
- `src/pages/SuperAdmin.tsx` — panel de gestión de boxes (extender con wizard)
- `src/utils/tenant.ts` — `getTenantSlugFromPath()` ya funciona
- `supabase/migrations/20260219_rls_multi_tenant_isolation.sql` — RLS completo

---

### Option B: Subdomain Routing + Self-Service Onboarding + Stripe Billing

Migrar el tenant resolver de path-based a subdomain-based (`crossfit-arena.boxora.website`). Crear un flujo de auto-registro para que un dueño de box pueda registrar su gym, completar el onboarding (nombre, logo, primer admin), y activar un plan de pago con Stripe. El super-admin solo supervisa.

✅ **Pros:**
- URL profesional: `mibox.boxora.website` — el estándar de todo SaaS.
- Auto-servicio: el dueño del box se registra sin intervención del team de Boxora.
- Billing automático con Stripe — revenue pasivo y escalable.
- El `tenant.ts` ya tiene el `TODO` para subdomain mode — la arquitectura lo prevé.
- Cada box se percibe como su propia app, reforzando el branding.

❌ **Cons:**
- Requiere configuración de wildcard DNS (`*.boxora.website`) y Vercel rewrites.
- El desarrollo local necesita setup adicional (e.g. `*.localhost` con un proxy).
- Integración con Stripe añade complejidad (webhooks, planes, estados de subscripción).
- El flujo de onboarding es nuevo código no trivial (3-4 pasos, validación).

📊 **Effort:** High

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `stripe` ^15.x | Billing: planes, subscripciones, webhooks | Via Supabase Edge Function |
| `@stripe/stripe-js` ^3.x | Checkout en el frontend | Solo en la página de billing |
| Vercel wildcard rewrites | Rutear `*.boxora.website` a la misma SPA | Config en `vercel.json` |

🔗 **Existing Code to Reuse:**
- `src/utils/tenant.ts` — `buildTenantUrl()` y `isMainDomain()`, solo cambiar implementación
- `src/contexts/AuthContext.tsx` — ya carga `currentBox` desde `profiles.box_id`
- `src/pages/Billing.tsx` — extender para mostrar estado de suscripción Stripe
- `supabase/migrations/20260219_superadmin_rls.sql` — RLS ya protege la tabla `boxes`
- `supabase/functions/` — Edge Functions existentes para nueva lógica de billing webhook

---

### Option C: Subdominio + Dominio Personalizado por Tenant

Igual que la Opción B pero añadiendo la capacidad de que cada box configure su propio dominio personalizado (e.g. `app.crossfitarena.com`). Requiere un proxy inverso (Cloudflare, Vercel Pro wildcard domains) que mapee dominios custom al tenant correcto.

✅ **Pros:**
- Máxima profesionalidad: el box no muestra "boxora.website" en la URL.
- Diferenciador de producto en el tier premium.

❌ **Cons:**
- Muy alta complejidad operativa: verificación de DNS, certificados TLS por dominio, proxy.
- Requiere Vercel Pro o Cloudflare Workers para custom domains a escala.
- El tenant resolver se complica: debe leer el hostname y buscarlo en la DB.
- No agrega valor para el MVP de multi-tenancy; prematuro.
- Costo de infraestructura significativamente mayor.

📊 **Effort:** High (+ infraestructura)

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| Vercel Pro | Custom domains per deployment | $$$, requiere plan |
| Cloudflare Workers | Proxy y routing por hostname | Alternativa más barata |

🔗 **Existing Code to Reuse:**
- `src/utils/tenant.ts` — `isMainDomain()` debe extenderse para lookups en DB

---

## Recommendation

**Opción B** es la recomendada porque:

1. **Subdomain routing** es el estándar de la industria para SaaS multi-tenant. El `tenant.ts` ya tiene el comentario `TODO: Future subdomain mode` — la arquitectura lo anticipó. El cambio está centralizado en un solo archivo.

2. **Self-service onboarding** es el desbloqueador clave. Sin él, el crecimiento está limitado por la capacidad manual del super-admin. Un wizard de 3 pasos (datos del box → configuración → plan) permite crecer sin intervención.

3. **Stripe billing** cierra el ciclo de negocio. El tab de Billing ya existe en la UI — conectarlo a Stripe es el paso natural. Usar Edge Functions de Supabase para los webhooks mantiene la arquitectura limpia.

4. **No destruye lo existente**: Todo el RLS, AuthContext, y SuperAdmin se reutilizan. Solo se cambia la estrategia de URL resolution y se añaden flujos nuevos.

Se trade-off la complejidad de Vercel/DNS setup (una sola vez) y el Stripe integration contra la escalabilidad ilimitada del negocio. La Opción A no es un producto SaaS real; la Opción C es prematura.

---

## Feature Description

### User-Facing Behavior

**Para el dueño de un nuevo box (Box Owner):**
1. Visita `boxora.website` (landing/marketing page — fuera de scope de esta feature, pero la `/` del dominio principal debe redirigir al formulario de registro).
2. Completa un wizard de 3 pasos:
   - **Paso 1 — Tu Box**: Nombre del gym, slug deseado (auto-generado, editable), country.
   - **Paso 2 — Tu cuenta**: Email y contraseña para el primer admin.
   - **Paso 3 — Tu plan**: Selección de plan (Freemium / Pro) + pago con Stripe Checkout.
3. Al completar, se crea el box en DB, se crea su profile como `admin`, y se le redirige a `{slug}.boxora.website/dashboard`.
4. Recibe email de bienvenida con el link a su subdominio.

**Para un atleta/coach (invitado por el admin):**
- El admin del box invita por email. El link de invitación va a `{slug}.boxora.website/signup?token=xxx`.
- El tenant resolver detecta el subdominio y fija `box_id` automáticamente.
- No necesitan saber qué es Boxora — solo ven el brand de su box.

**Para el super-admin:**
- Accede a `boxora.website/admin` (o `admin.boxora.website`) para ver todos los tenants.
- Puede suspender, reactivar, o ver el billing de cualquier tenant.
- Ve métricas cross-tenant: total de boxes, MRR, atletas activos.

### Internal Behavior

**Tenant Resolution (cambio central):**
1. Al cargar la app, `tenant.ts` lee `window.location.hostname`.
2. Si el hostname es `{slug}.boxora.website`, extrae el slug.
3. La app hace un fetch anónimo a Supabase para obtener el `box_id` del slug.
4. Este `box_id` se inyecta en el contexto de Auth para que el RLS de Supabase funcione automáticamente.

**Onboarding Flow:**
1. POST a Supabase: crea registro en `boxes` (slug único), crea cuenta en `auth.users`.
2. El trigger existente de Supabase crea el `profile` con `box_id` y `role_id = 'admin'`.
3. Stripe Checkout session creada via Edge Function; webhook actualiza `boxes.subscription_status`.

**Subdomain Setup (one-time infra):**
- DNS: `*.boxora.website` → Vercel.
- `vercel.json`: rewrite `/*` para todas las rutas a `index.html` (ya existe para SPA).
- `tenant.ts`: `buildTenantUrl(slug)` retorna `https://{slug}.boxora.website`.

### Edge Cases & Error Handling

- **Slug inválido o box no encontrada**: Mostrar página 404 con "Este box no existe" y link al registro.
- **Slug ya tomado**: Validación en tiempo real en el wizard (debounce, query a `boxes` con anon key).
- **Stripe payment failed**: El box se crea en estado `trial` (7 días); si no paga, se suspende (acceso de solo-lectura).
- **Usuario accede a subdominio incorrecto**: Si el `box_id` del profile no coincide con el subdominio, mostrar error "No tienes acceso a este box".
- **Super-admin en subdominio de otro box**: El `isRoot` bypass debe funcionar en cualquier subdominio.
- **Localhost en desarrollo**: `isMainDomain()` devuelve `true` para localhost; usar `?box=slug` como query param en dev mode.

---

## Capabilities

### New Capabilities

- `tenant-subdomain-resolver`: Resolución de tenant por subdominio en lugar de path.
- `box-self-registration`: Wizard de auto-registro para nuevos boxes (3 pasos).
- `stripe-billing-integration`: Planes, subscripciones y webhooks por tenant.
- `box-invitation-flow`: Invitación de miembros por email con token de box pre-asignado.
- `tenant-suspension`: Suspensión de acceso por falta de pago o por super-admin.

### Modified Capabilities

- `tenant-url-resolver` (`src/utils/tenant.ts`): Cambiar de path-based a subdomain-based.
- `auth-context` (`src/contexts/AuthContext.tsx`): Leer box context desde hostname además de profile.
- `login-page` (`src/pages/Login.tsx`): Resolver box desde subdominio, no solo desde `/box/:slug`.
- `super-admin-panel` (`src/pages/SuperAdmin.tsx`): Añadir métricas de billing y acción de suspender/reactivar.

---

## Impact & Integration

| Affected Component | Impact Type | Notes |
|---|---|---|
| `src/utils/tenant.ts` | modifies | Implementar subdomain resolver; mantener path-based como fallback dev |
| `src/contexts/AuthContext.tsx` | modifies | Inyectar `box_id` desde subdominio antes de fetch de profile |
| `src/pages/Login.tsx` | modifies | Leer slug desde hostname; eliminar dependencia de `/box/:slug` route |
| `src/App.tsx` | modifies | Limpiar la route `/box/:boxSlug` cuando subdominio sea la fuente de verdad |
| `src/pages/Billing.tsx` | extends | Conectar con Stripe Customer Portal |
| `src/pages/SuperAdmin.tsx` | extends | Métricas cross-tenant, acción suspend/reactivate |
| `supabase/migrations/` | extends | Añadir `subscription_status`, `stripe_customer_id` a tabla `boxes` |
| `supabase/functions/` | new | Edge Function para Stripe webhooks |
| `vercel.json` | modifies | Añadir wildcard domain rewrites |
| Nueva página `/register-box` | new | Wizard de 3 pasos de onboarding |

---

## Open Questions

- [ ] ¿El plan freemium existe o solo hay un plan de pago? Definir tiers — Por los momentos un solo plan de pago
- [ ] ¿Qué pasa con los boxes ya creados por el SuperAdmin? ¿Se les asigna un plan manual? — Haz la modificaciones necesarias para que se les asigne un plan manual
- [ ] ¿Vercel soporta wildcard subdomains en el plan actual? Verificar plan y costo — por los momentos es el plan gratuito que tengo y un dominio comprado en namecheap
- [ ] ¿El email de invitación se envía via Supabase Auth o via un proveedor externo (Resend)? — Por el momento no se enviaran emails de invitación
- [ ] ¿El login en `boxora.website/login` (sin subdominio) sigue siendo necesario para el super-admin? — si porque el super admin es un usuario mas 
- [ ] ¿Se necesita una landing page/marketing page en `boxora.website`? ¿O es out-of-scope? — No por el momento
