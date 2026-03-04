# Brainstorm: Panel Administrativo de Box (Boxora Admin)

**Date**: 2026-03-03
**Author**: Claude Code Agent
**Status**: exploration
**Recommended Option**: B

---

## Problem Statement

El administrador de un box en Boxora (rol `admin`) actualmente carece de un panel centralizado que le permita gestionar su box de forma completa. Las capacidades existentes están fragmentadas en distintas rutas (`/settings`, `/members`, `/billing`, `/roles`, `/audit-logs`), sin una vista de control unificada que muestre el estado del box de un vistazo.

**Problema específico:**
- No existe un "home" de administración: el admin llega al `/dashboard` pensado para todos los usuarios.
- No hay visibilidad de métricas clave del box en un único lugar (estado de suscripción, miembros activos, ingresos del mes, reservas del día).
- La gestión de configuración del box (branding, apariencia, navegación) está en `/settings` sin contexto operativo.
- El admin no puede ver alertas críticas (box próximo a suspensión, pagos pendientes, members sin rol asignado).
- Tareas operativas comunes (crear clase, registrar pago, agregar miembro) requieren navegar a múltiples secciones.

**Usuarios afectados:**
- Admin del box (dueño o responsable del CrossFit/Box).
- Potencialmente: receptionist (subconjunto de operaciones).

**Por qué ahora:**
La plataforma está lista para ser adoptada por boxes reales. Sin un panel admin claro, el onboarding es confuso y el valor percibido cae en las primeras horas de uso.

---

## Constraints & Requirements

- **Multi-tenant**: Las operaciones deben estar aisladas por `box_id` (RLS ya aplicado). Nunca mostrar datos de otros boxes.
- **Role-based**: Solo usuarios con `role_id = 'admin'` acceden al panel completo. Receptionist puede acceder a subconjuntos.
- **Stack fijo**: React + TypeScript + Vite + React Router v7 + Supabase + Radix UI + Tailwind CSS. Sin cambiar stack.
- **Componentes existentes**: Reutilizar `Button`, `Card`, `Dialog`, `Input`, `Badge`, `Switch`, `Tabs`, `Table` del sistema de diseño en `src/components/ui/`.
- **Supabase como backend**: Todas las operaciones deben ir contra Supabase (no Edge Functions nuevas salvo necesidad de lógica compleja).
- **RLS compliance**: No se puede bypassear Row Level Security. Las queries deben respetar la sesión de auth.
- **Sin breaking changes**: No modificar rutas existentes ni la lógica de auth/tenant. Extender, no reemplazar.
- **Accesibilidad**: Radix UI ya proporciona ARIA; mantener ese patrón.
- **Internacionalización**: Usar `react-i18next` con claves en español como idioma base (ya implementado).
- **Dark/Light mode**: El sistema de temas ya existe vía `theme-provider`; respetar variables CSS.

---

## Options Explored

### Option A: Admin Dashboard como nueva ruta dedicada `/admin-box`

Crear una ruta completamente nueva `/admin-box` con su propio layout que consolide todas las capacidades administrativas en un solo lugar: resumen ejecutivo (KPIs), accesos rápidos a operaciones frecuentes, alertas, y navegación hacia sub-módulos existentes.

✅ **Pros:**
- Separación clara entre vista operativa del staff y panel administrativo.
- No perturba rutas existentes, cero riesgo de regresiones.
- Puede crecer de forma independiente.
- Dashboard con métricas (revenue, members, occupancy) visible solo para admin.

❌ **Cons:**
- Duplicación de navegación: el admin tiene dos "hogar" (`/dashboard` y `/admin-box`).
- Requiere decidir cuándo redirigir al admin: ¿siempre a `/admin-box`? ¿O es opcional?
- Riesgo de fragmentación si los sub-módulos no actualizan sus links hacia este nuevo centro.

📊 **Effort:** Medium

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `recharts` (ya instalado) | KPI charts (revenue trend, occupancy) | Ya en uso en `/analytics` |
| `@radix-ui/react-tabs` (ya instalado) | Secciones dentro del panel | Ya en uso en `/settings` |
| `lucide-react` (ya instalado) | Iconografía | Ya en uso en toda la app |

🔗 **Existing Code to Reuse:**
- `src/pages/SuperAdmin.tsx` — Patrón de cards con métricas y acciones por fila
- `src/pages/Analytics.tsx` — Queries de métricas (revenue, sessions count)
- `src/contexts/AuthContext.tsx` — `currentBox`, `isAdmin`, `userProfile`
- `src/components/ui/card.tsx` — Card con header/content/footer
- `src/layouts/MainLayout.tsx` — Layout con sidebar (extender nav items)

---

### Option B: Panel Admin Integrado con Tab especial en el Dashboard existente + Sección de Configuración Enriquecida

Transformar `/dashboard` para que cuando el usuario es `admin`, tenga tabs adicionales (Overview / Operations / Box Config) que consolidan la vista ejecutiva y las acciones de gestión. La ruta `/settings` se enriquece con nuevas secciones (Plans, Subscription, Danger Zone). Se agrega una barra de "Admin Quick Actions" en el layout.

✅ **Pros:**
- Un solo punto de entrada para todos los roles; el admin ve más que el resto.
- Progressive disclosure: el dashboard crece de forma natural.
- Menor superficie de código nuevo; se extienden componentes ya probados.
- Coherencia UX: los usuarios entienden que el dashboard ES el centro de control.

❌ **Cons:**
- El `dashboard` actual puede volverse complejo si mezcla demasiadas responsabilidades.
- Las tabs de admin en el dashboard implican lógica condicional más elaborada.
- Requiere cuidado para no mostrar accidentalmente tabs de admin a roles no-admin.

📊 **Effort:** Medium

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `recharts` (ya instalado) | KPI charts | Ya en uso |
| `@radix-ui/react-tabs` (ya instalado) | Tabs de admin en dashboard | Ya en uso en settings |
| `@radix-ui/react-dialog` (ya instalado) | Modales de confirmación para acciones peligrosas | Ya en uso |

🔗 **Existing Code to Reuse:**
- `src/pages/Dashboard.tsx` — Extender con tabs condicionales por rol
- `src/pages/Settings.tsx` — Agregar tabs: Subscription, Plans, Danger Zone
- `src/contexts/AuthContext.tsx` — `isAdmin`, `currentBox`
- `src/components/ui/confirmation-dialog.tsx` — Para acciones destructivas

---

### Option C: Micro-frontend Admin Shell con lazy-loading

Crear un shell de administración autónomo como sub-aplicación React (lazy-loaded) montado en `/box-admin/*` con su propio router interno. Cada sección (overview, members, billing, config) es un módulo lazy-loaded con code splitting agresivo.

✅ **Pros:**
- Bundle pequeño para usuarios no-admin (no cargan nada del admin shell).
- Puede evolucionar hacia una verdadera "admin app" separada.
- Secciones independientes con sus propios lifecycle.

❌ **Cons:**
- Complejidad de setup para el equipo (lazy router dentro de router).
- Overhead de abstracciones para un MVP.
- El beneficio de code splitting es marginal a escala actual.
- Introduce patrones no usados en el resto del codebase.

📊 **Effort:** High

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `React.lazy` + `Suspense` | Code splitting | Nativo, sin dependencias nuevas |
| `react-router-dom` (ya instalado) | Sub-routing | Requiere anidamiento cuidadoso |

🔗 **Existing Code to Reuse:**
- `src/App.tsx` — Agregar lazy route para el shell
- `src/layouts/MainLayout.tsx` — Posible reutilización del sidebar

---

### Option D: Admin Panel como Drawer/Sidebar deslizable global (No-route approach)

Panel de administración accesible desde cualquier ruta como un drawer lateral deslizable. El admin activa el panel desde un botón flotante en el layout y puede gestionar configuración, ver métricas básicas y lanzar acciones sin salir de donde está.

✅ **Pros:**
- UX innovadora: acceso al panel sin perder el contexto actual.
- Cero cambios de ruta.
- Ideal para acciones rápidas (cambiar nombre del box, activar/desactivar nav item).

❌ **Cons:**
- No escala bien para vistas complejas (tablas de members, billing history).
- Accesibilidad compleja para drawers con mucho contenido.
- No es la convención esperada para un "panel de administración" completo.
- Dificulta el deep-linking a secciones específicas.

📊 **Effort:** Medium

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `@radix-ui/react-dialog` (ya instalado) | Sheet/Drawer pattern | Usar variant sheet |
| `lucide-react` (ya instalado) | Trigger icon | Ya disponible |

🔗 **Existing Code to Reuse:**
- `src/layouts/MainLayout.tsx` — Punto de inyección del trigger

---

## Recommendation

**Option B** es la recomendada porque:

1. **Menor riesgo de regresión**: Extiende rutas y componentes existentes en lugar de crear nueva infraestructura de routing. El código de auth, tenant, y layout no cambia.

2. **Coherencia con la UX actual**: El equipo y los primeros usuarios ya conocen `/dashboard` y `/settings`. Agregar capas de administración ahí es progressive disclosure, no disrupción.

3. **Scope correcto para el MVP**: Las funciones pedidas (configuración de boxes, gestión operativa) encajan perfectamente en tabs adicionales del dashboard y secciones nuevas en settings.

4. **Reutilización máxima**: Los componentes `Card`, `Tabs`, `Dialog`, `Badge` ya implementados en `/settings` y `/analytics` son exactamente lo que se necesita. El esfuerzo va a lógica de negocio, no a infraestructura UI.

5. **Lo que se sacrifica**: Separación pura de concerns (el dashboard mezcla vistas de staff y admin). Es un trade-off aceptable porque la separación está dada por tabs condicionales, que son claros y seguros.

---

## Feature Description

### User-Facing Behavior

**Dashboard Admin Tabs:**
Cuando un usuario con rol `admin` accede a `/dashboard`, ve tres tabs en la parte superior:
- **"Resumen"** (default, igual para todos): métricas del día (clases, miembros activos, asistencia).
- **"Operaciones"** (solo admin): vista ejecutiva del box con KPIs del mes (ingresos, nuevos miembros, tasa de asistencia), alertas operativas (pagos vencidos, miembros sin clase en 30 días, cupo de clases alto), y acciones rápidas con un click (crear clase, registrar pago, invitar miembro).
- **"Mi Box"** (solo admin): accesos directos a las sub-secciones de configuración del box con preview del estado actual (plan de suscripción, estado, último cambio de branding).

**Settings enriquecido:**
La ruta `/settings` agrega dos tabs nuevas visibles solo para admin:
- **"Suscripción"**: muestra el plan actual (trial/active/suspended/cancelled) con fecha de vencimiento estimada, próximo cobro, y un CTA para upgradear.
- **"Zona de Peligro"**: acciones destructivas con confirmación doble: cambiar slug del box, transferir propiedad, pausar/eliminar el box.

**Box Info Banner:**
En el header del `MainLayout`, el admin ve un banner/badge discreto mostrando el estado de suscripción del box. Si está en `trial`, muestra días restantes con link a suscripción.

### Internal Behavior

**Flujo de datos — Dashboard Admin Tabs:**
1. Al montar el componente, si `isAdmin === true`, se realiza en paralelo:
   - Query a `sessions` para contar clases del día y ocupación.
   - Query a `invoices` para revenue del mes actual.
   - Query a `profiles` para contar nuevos miembros del mes.
   - Query a `audit_logs` para alertas recientes.
2. Los resultados se muestran en cards de KPI con micro-charts de recharts (sparkline del mes).
3. Las "acciones rápidas" usan los mismos handlers ya implementados en sus módulos respectivos (abrir Dialog de nueva clase, etc.) o navegan a la ruta correspondiente con estado pre-poblado.

**Flujo de datos — Settings Subscription Tab:**
1. Lee `currentBox.subscription_status` del contexto (ya disponible vía `AuthContext`).
2. Para mostrar fecha estimada de fin de trial: calcula desde `currentBox.created_at` + 30 días (lógica en cliente).
3. El CTA de upgrade envía email o redirige a una URL de contacto/checkout (placeholder en MVP).

**Flujo de datos — Settings Danger Zone:**
1. Cambio de slug: UPDATE en tabla `boxes` → requiere que el admin reingrese su contraseña para confirmación (usa `supabase.auth.reauthenticate()`).
2. Pausar box: UPDATE `subscription_status` a `suspended` — solo superadmin puede revertirlo (diferenciación de permisos).

### Edge Cases & Error Handling

- **Admin sin box**: Si `currentBox` es null en el contexto (edge case de race condition), las tabs de admin se ocultan y se muestra un spinner.
- **Queries de métricas fallan**: Cada card de KPI tiene su propio estado de error local; un fallo no bloquea toda la vista. Se muestra `—` en lugar del valor.
- **Trial expirado**: Si `subscription_status === 'suspended'` o `=== 'cancelled'`, el banner en el header es prominente en rojo con un único CTA para contactar al soporte.
- **Cambio de slug inválido**: El slug ya existe o tiene caracteres inválidos → error inline bajo el input, sin enviar al servidor hasta que sea válido.
- **Receptionist vs Admin**: Las tabs de admin en el dashboard y la tab de Suscripción en settings NO se renderizan si `isAdmin === false`. El código de renderizado condicional usa el valor de `isAdmin` del AuthContext, no del query directo a DB (ya verificado al login).
- **Concurrencia**: Si dos admins cambian configuración simultáneamente (raro, pero posible), el último UPDATE gana. Se puede agregar `updated_at` check optimista en el futuro.

---

## Capabilities

### New Capabilities
- `admin-dashboard-kpis`: Vista ejecutiva con KPIs del mes (revenue, members, attendance) accesible desde el dashboard cuando el usuario es admin.
- `admin-quick-actions`: Acciones de un click desde el dashboard de admin (crear clase, registrar pago, invitar miembro).
- `admin-subscription-view`: Tab en settings que muestra el plan activo, fechas y CTA de upgrade.
- `admin-danger-zone`: Tab en settings con acciones destructivas protegidas (cambiar slug, suspender box).
- `admin-status-banner`: Banner en el header del layout que muestra estado de suscripción con alertas visuales.
- `admin-operational-alerts`: Panel de alertas en el dashboard de admin (pagos vencidos, miembros inactivos, etc.).

### Modified Capabilities
- `settings` (existente `src/pages/Settings.tsx`): Agrega dos tabs nuevas (Suscripción, Zona de Peligro) visibles solo para admin.
- `dashboard` (existente `src/pages/Dashboard.tsx`): Agrega tabs condicionales para admin (Operaciones, Mi Box).
- `main-layout` (existente `src/layouts/MainLayout.tsx`): Agrega banner de estado de suscripción en el header para admins.

---

## Impact & Integration

| Affected Component | Impact Type | Notes |
|---|---|---|
| `src/pages/Dashboard.tsx` | modifies | Agrega tabs condicionales por rol |
| `src/pages/Settings.tsx` | extends | Agrega 2 tabs nuevas al sistema de tabs existente |
| `src/layouts/MainLayout.tsx` | extends | Agrega banner/badge de estado de suscripción |
| `src/contexts/AuthContext.tsx` | depends on | Lee `isAdmin`, `currentBox`, `currentBox.subscription_status` |
| `src/types/supabase.ts` | depends on | Tipos ya definidos; puede requerir tipos de queries para métricas |
| `supabase/migrations/` | possible extends | Si se agregan columnas (e.g., `trial_ends_at`, `plan_type`) al esquema de boxes |
| `src/i18n/` (locales) | extends | Nuevas claves de traducción para las vistas de admin |
| `src/components/ui/` | depends on | Reutiliza Card, Tabs, Dialog, Badge, Button existentes |

---

## Open Questions

- [ ] **¿Qué define "fin del trial"?** ¿Es `created_at + 30 días` o hay un campo explícito `trial_ends_at` que debería agregarse a la tabla `boxes`? — Me gusta tu opcion de agregar un campo explicito
- [ ] **¿Las Quick Actions del admin abren Dialogs in-situ o navegan a la ruta del módulo?** Para MVP, ¿navegación simple o modal in-dashboard? — Me gusta tu opcion de que abra dialogos in-situ
- [ ] **¿El "upgrade de plan" tiene destino concreto?** ¿URL de pago externo, formulario de contacto, o es un placeholder para el MVP? — Me gusta tu opcion de que sea un placeholder para el MVP
- [ ] **¿Puede el admin pausar su propio box?** Actualmente solo el superadmin puede cambiar `subscription_status`. ¿Se quiere darle ese control al admin? — Me gusta tu opcion de que el admin pueda pausar su propio box
- [ ] **¿Se necesitan métricas en tiempo real (Supabase Realtime) o basta con fetch al montar el componente?** — Me gusta tu opcion  de que baste con fetch al montar el componente
- [ ] **¿El receptionist ve las tabs de "Operaciones" en el dashboard?** ¿O solo las ve el admin? — Solo el admin
