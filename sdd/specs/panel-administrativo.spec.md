# Feature Specification: Panel Administrativo de Box

**Feature ID**: FEAT-003
**Date**: 2026-03-03
**Author**: Cesar Armas
**Status**: approved
**Target version**: MVP

---

## 1. Motivation & Business Requirements

### Problem Statement

El administrador de un box en Boxora (rol `admin`) carece de un panel de control centralizado. Las
capacidades de gestión existen pero están fragmentadas en múltiples rutas (`/settings`, `/members`,
`/billing`, `/roles`, `/audit-logs`) sin una vista unificada que muestre el estado del box de un
vistazo, alertas críticas, o acciones operativas de un solo click.

Sin este panel, el onboarding de nuevos boxes es confuso y el valor percibido de la plataforma cae
en las primeras horas de uso.

### Goals

- Dar al admin una vista ejecutiva con KPIs del mes (ingresos, miembros, ocupación) directamente en el dashboard.
- Mostrar alertas operativas accionables (pagos vencidos, miembros inactivos, cupos altos).
- Habilitar acciones rápidas in-situ (crear clase, registrar pago, invitar miembro) sin cambiar de página.
- Mostrar el estado de suscripción del box en todo momento (banner en header).
- Agregar gestión de suscripción y acciones de "zona de peligro" en `/settings`.
- Añadir el campo `trial_ends_at` a la tabla `boxes` para definir explícitamente el fin del período de prueba.

### Non-Goals (explícitamente fuera de alcance)

- No se construye un sistema de pagos real (Stripe, MercadoPago). El CTA de upgrade es un placeholder.
- No se implementa Supabase Realtime; métricas se cargan al montar el componente (fetch estático).
- No se modifica la lógica de routing existente ni el sistema de auth/tenant.
- No se crea una ruta nueva dedicada al admin (`/admin-box`); se extienden rutas existentes.
- El receptionist NO accede a las tabs de admin; solo el rol `admin` tiene visibilidad total.
- No se implementa transferencia de propiedad del box en este MVP.

---

## 2. Architectural Design

### Overview

Se adopta la **Option B** del brainstorm: panel integrado mediante extensión de componentes
existentes. Tres áreas de cambio:

1. **`/dashboard`**: Cuando `isAdmin === true`, el dashboard muestra tabs adicionales
   "Operaciones" y "Mi Box" junto al tab "Resumen" existente (visible para todos los roles).
   Las tabs de admin cargan sus propios datos en paralelo con `Promise.all` al montarse.

2. **`/settings`**: Se agregan dos tabs nuevas, visibles solo para admin:
   "Suscripción" y "Zona de Peligro". Se insertan al final del `TabsList` existente.

3. **`MainLayout` header**: Se agrega un `SubscriptionBanner` discreto en el header que
   muestra el estado de suscripción del box. En estado `trial`, muestra días restantes.
   En `suspended`/`cancelled`, muestra banner rojo prominente.

4. **Migración DB**: Se agrega `trial_ends_at TIMESTAMPTZ` a la tabla `boxes`.
   Se agrega RLS policy para que el admin pueda actualizar `subscription_status` de su propio box
   (a `suspended` únicamente; reactivar sigue siendo potestad del superadmin).

### Component Diagram

```
MainLayout (header)
  └── SubscriptionBanner          ← nuevo componente

/dashboard (Dashboard.tsx)
  ├── Tab: "Resumen"              ← existente, sin cambios
  ├── Tab: "Operaciones"          ← nuevo, solo admin
  │     ├── KpiCard × 4          ← nuevo componente reutilizable
  │     ├── AlertsPanel          ← nuevo componente
  │     └── QuickActionsBar      ← nuevo componente
  │           ├── Dialog: NuevaClase   ← extrae lógica de /schedule
  │           ├── Dialog: NuevoPago    ← extrae lógica de /billing
  │           └── Dialog: InvitarMiembro ← extrae lógica de /members
  └── Tab: "Mi Box"              ← nuevo, solo admin
        └── BoxStatusCard        ← nuevo componente (links a /settings)

/settings (Settings.tsx)
  ├── Tab: Branding              ← existente
  ├── Tab: Apariencia            ← existente
  ├── Tab: Navegación            ← existente
  ├── Tab: Localización          ← existente
  ├── Tab: Notificaciones        ← existente
  ├── Tab: Suscripción           ← nuevo, solo admin
  └── Tab: Zona de Peligro       ← nuevo, solo admin

supabase/migrations/
  └── YYYYMMDD_admin_panel.sql   ← agrega trial_ends_at + RLS policy
```

### Integration Points

| Existing Component | Integration Type | Notes |
|---|---|---|
| `src/pages/Dashboard.tsx` | modifies | Agrega `Tabs` condicionales por `isAdmin` |
| `src/pages/Settings.tsx` | extends | Agrega 2 tabs nuevas al `TabsList` existente |
| `src/layouts/MainLayout.tsx` | extends | Inyecta `<SubscriptionBanner>` en el header |
| `src/contexts/AuthContext.tsx` | depends on | Lee `isAdmin`, `currentBox`, `currentBox.subscription_status`, `currentBox.created_at` |
| `src/components/ui/` | depends on | `Card`, `Tabs`, `Dialog`, `Badge`, `Button`, `Input`, `Label`, `Separator` |
| `src/components/ui/confirmation-dialog.tsx` | depends on | Usado en Danger Zone para confirmaciones dobles |
| `supabase` (tabla `boxes`) | DB extends | Agrega columna `trial_ends_at` |
| `supabase` (RLS) | DB extends | Permite al admin hacer UPDATE de `subscription_status = 'suspended'` en su propio box |
| Queries: `sessions`, `invoices`, `profiles`, `audit_logs` | new queries | Para métricas del KPI panel |

### Data Models

```typescript
// Extensión del tipo Box (src/types/supabase.ts)
// Agregar en boxes.Row:
trial_ends_at: string | null  // TIMESTAMPTZ

// Tipo para KPI cards (local al componente)
interface KpiMetric {
  label: string;
  value: number | string;
  delta?: number;       // % cambio vs mes anterior
  loading: boolean;
  error: boolean;
}

// Tipo para alertas operativas (local al componente)
interface AdminAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  actionLabel?: string;
  actionHref?: string;
}
```

### New Public Interfaces

```typescript
// src/components/admin/SubscriptionBanner.tsx
interface SubscriptionBannerProps {
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trialEndsAt: string | null;   // ISO date string
}

// src/components/admin/KpiCard.tsx
interface KpiCardProps {
  label: string;
  value: number | string;
  delta?: number;
  icon: React.ReactNode;
  loading?: boolean;
  error?: boolean;
}

// src/components/admin/AlertsPanel.tsx
interface AlertsPanelProps {
  alerts: AdminAlert[];
  loading: boolean;
}

// src/components/admin/QuickActionsBar.tsx
// Sin props; usa AuthContext internamente para box_id
```

---

## 3. Module Breakdown

### Module 1: Migración de Base de Datos
- **Path**: `supabase/migrations/YYYYMMDD_admin_panel.sql`
- **Responsibility**:
  - Agrega columna `trial_ends_at TIMESTAMPTZ` a la tabla `boxes`.
  - Rellena `trial_ends_at` para boxes existentes como `created_at + INTERVAL '30 days'`.
  - Agrega/actualiza RLS policy en `boxes` para permitir que el admin haga UPDATE de
    `subscription_status` a `'suspended'` únicamente en su propio box.
  - Actualiza el tipo TypeScript `supabase.ts` si se autogenera (o actualizarlo manualmente).
- **Depends on**: ninguno (prerequisito de todos los demás módulos)

### Module 2: SubscriptionBanner (header component)
- **Path**: `src/components/admin/SubscriptionBanner.tsx`
- **Responsibility**:
  - Componente React que recibe `status` y `trialEndsAt`.
  - Calcula días restantes de trial (`trialEndsAt - now()`).
  - Renderiza: nada (si `active`), badge ámbar con días restantes (si `trial`), banner rojo (si `suspended`/`cancelled`).
  - Incluye botón "Actualizar plan" que es un placeholder (`href="mailto:soporte@boxora.com"`).
- **Depends on**: `src/components/ui/badge.tsx`, `src/components/ui/button.tsx`

### Module 3: Integración del Banner en MainLayout
- **Path**: `src/layouts/MainLayout.tsx` (modificación)
- **Responsibility**:
  - Importa `SubscriptionBanner` y lo inyecta en el header, visible solo si `isAdmin === true`.
  - Lee `currentBox.subscription_status` y `currentBox.trial_ends_at` del AuthContext.
- **Depends on**: Module 2, `src/contexts/AuthContext.tsx`

### Module 4: KpiCard (componente reutilizable)
- **Path**: `src/components/admin/KpiCard.tsx`
- **Responsibility**:
  - Card de KPI genérica con label, valor, delta (%), icono, y estados loading/error.
  - En estado loading: muestra skeleton animation.
  - En estado error: muestra `—` con tooltip de error.
  - Delta positivo = verde, negativo = rojo.
- **Depends on**: `src/components/ui/card.tsx`, `lucide-react`

### Module 5: AlertsPanel (componente de alertas)
- **Path**: `src/components/admin/AlertsPanel.tsx`
- **Responsibility**:
  - Recibe array de `AdminAlert[]` y muestra lista con íconos por tipo.
  - Si `alerts.length === 0`: muestra estado vacío con mensaje positivo.
  - Cada alerta puede tener un link de acción opcional (e.g., "Ver pagos pendientes" → `/billing`).
- **Depends on**: `lucide-react`, `src/components/ui/badge.tsx`

### Module 6: QuickActionsBar (barra de acciones rápidas)
- **Path**: `src/components/admin/QuickActionsBar.tsx`
- **Responsibility**:
  - Tres botones: "Nueva Clase", "Registrar Pago", "Invitar Miembro".
  - Cada botón abre un `Dialog` in-situ con formulario mínimo.
  - Los formularios usan `supabase` directamente (INSERT básico) sin reutilizar lógica de páginas externas (evitar acoplamiento).
  - Al completar, muestra toast de éxito o mensaje de error inline.
- **Depends on**: `src/components/ui/dialog.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/lib/supabaseClient.ts`, `src/contexts/AuthContext.tsx`

### Module 7: Tab "Operaciones" en Dashboard
- **Path**: `src/pages/Dashboard.tsx` (modificación)
- **Responsibility**:
  - Envuelve el contenido existente del dashboard en un `Tab` llamado "Resumen".
  - Si `isAdmin === true`, agrega tabs "Operaciones" y "Mi Box" al `TabsList`.
  - "Operaciones": carga métricas en paralelo (`Promise.all`) al montar:
    - Ingresos del mes: `SELECT SUM(amount) FROM invoices WHERE box_id = ? AND created_at >= inicio_mes`
    - Nuevos miembros del mes: `SELECT COUNT(*) FROM profiles WHERE box_id = ? AND created_at >= inicio_mes`
    - Clases del día: `SELECT COUNT(*) FROM sessions WHERE box_id = ? AND date = today`
    - Alertas: lógica derivada de múltiples queries (ver Module 5).
  - Renderiza `KpiCard × 4`, `AlertsPanel`, `QuickActionsBar`.
  - "Mi Box": muestra `BoxStatusCard` con link a `/settings`.
- **Depends on**: Modules 4, 5, 6; `src/contexts/AuthContext.tsx`

### Module 8: Tab "Suscripción" en Settings
- **Path**: `src/pages/Settings.tsx` (modificación)
- **Responsibility**:
  - Agrega `TabsTrigger` "Suscripción" y su `TabsContent` al sistema de tabs existente.
  - Visible solo si `isAdmin === true`.
  - Contenido: plan actual (badge de status), fecha de fin de trial calculada desde `currentBox.trial_ends_at`, días restantes, CTA placeholder "Contactar para upgrade" (`mailto:`).
- **Depends on**: Module 1 (campo `trial_ends_at` en DB), `src/contexts/AuthContext.tsx`

### Module 9: Tab "Zona de Peligro" en Settings
- **Path**: `src/pages/Settings.tsx` (modificación, mismo archivo que Module 8)
- **Responsibility**:
  - Agrega `TabsTrigger` "Zona de Peligro" y su `TabsContent`.
  - Visible solo si `isAdmin === true`.
  - Acción: **Cambiar slug** — input de texto con validación de formato (regex `^[a-z0-9-]+$`),
    comprobación de disponibilidad via SELECT antes de guardar, confirmación doble con
    `ConfirmationDialog`, UPDATE en `boxes`. Requiere reautenticación
    (`supabase.auth.reauthenticate()`) antes de enviar.
  - Acción: **Pausar Box** — botón con `ConfirmationDialog` que hace UPDATE de
    `subscription_status = 'suspended'`. Banner rojo aparece de inmediato en el header.
    Muestra aviso: "Solo el soporte de Boxora puede reactivar el box."
- **Depends on**: Module 1 (RLS policy), `src/components/ui/confirmation-dialog.tsx`, `src/contexts/AuthContext.tsx`

### Module 10: Claves i18n para el panel admin
- **Path**: `src/i18n/locales/es/translation.json` (o el archivo de traducción que corresponda)
- **Responsibility**:
  - Agrega todas las claves necesarias para los módulos 2–9 bajo el namespace `admin`.
  - Ejemplo: `admin.kpi.revenue`, `admin.kpi.members`, `admin.alerts.pending_payments`, etc.
- **Depends on**: ninguno (puede hacerse en paralelo con otros módulos)

---

## 4. Test Specification

### Verificación Manual (MVP — sin test runner configurado)

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| Admin ve tabs de Operaciones | Login como admin → ir a `/dashboard` | Tabs "Resumen", "Operaciones", "Mi Box" visibles |
| Staff no ve tabs de admin | Login como coach/athlete → ir a `/dashboard` | Solo tab "Resumen" visible |
| KPIs cargan correctamente | Admin en tab Operaciones, box con datos | 4 KPI cards con valores numéricos (no `—`) |
| KPI falla gracefully | Forzar error de red (Network tab dev tools) | Cards muestran `—`, resto del panel funciona |
| Banner de trial | Box con `subscription_status = 'trial'` | Badge ámbar en header con días restantes |
| Banner de suspendido | Box con `subscription_status = 'suspended'` | Banner rojo en header, CTA visible |
| Banner ausente si activo | Box con `subscription_status = 'active'` | Sin banner en header |
| Quick Action: Nueva Clase | Click "Nueva Clase" → llenar form → guardar | Clase aparece en `/schedule`, toast de éxito |
| Quick Action: Invitar Miembro | Click "Invitar Miembro" → email → guardar | Perfil creado, toast de éxito |
| Tab Suscripción visible | Admin en `/settings` | Tab "Suscripción" presente |
| Tab Suscripción oculta | Coach en `/settings` | Tab "Suscripción" no presente |
| Cambiar slug válido | Admin → Danger Zone → cambiar slug → confirmar | Slug actualizado, URL del box cambia |
| Cambiar slug inválido | Admin → Danger Zone → slug con mayúsculas | Error inline, botón de guardar deshabilitado |
| Slug ya existente | Admin → Danger Zone → slug de otro box | Error inline "slug no disponible" |
| Pausar box | Admin → Danger Zone → Pausar → confirmar | `subscription_status = 'suspended'`, banner rojo inmediato |
| Reautenticación requerida | Admin → Danger Zone → cambiar slug | Modal de contraseña antes de UPDATE |

### Prueba de Migración

```sql
-- Verificar columna creada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'boxes' AND column_name = 'trial_ends_at';

-- Verificar que boxes existentes tienen trial_ends_at populado
SELECT id, created_at, trial_ends_at
FROM boxes
WHERE trial_ends_at IS NULL;
-- Debe retornar 0 filas

-- Verificar RLS: admin puede suspender su propio box
-- (ejecutar como usuario admin con box_id conocido)
UPDATE boxes SET subscription_status = 'suspended' WHERE id = '<box_id_propio>';
-- Debe ejecutar sin error

-- Verificar RLS: admin NO puede activar su propio box
UPDATE boxes SET subscription_status = 'active' WHERE id = '<box_id_propio>';
-- Debe fallar con error de RLS
```

---

## 5. Acceptance Criteria

> Esta feature está completa cuando TODOS los siguientes criterios son verdaderos:

- [ ] Un usuario con `role_id = 'admin'` ve las tabs "Operaciones" y "Mi Box" en `/dashboard`.
- [ ] Un usuario con cualquier otro rol NO ve las tabs de admin en `/dashboard`.
- [ ] Los 4 KPI cards cargan correctamente con datos reales del box del admin.
- [ ] Cada KPI card falla de forma aislada (muestra `—`) sin romper los demás cards.
- [ ] Las 3 Quick Actions abren dialogs in-situ y persisten correctamente en Supabase.
- [ ] El `SubscriptionBanner` muestra el estado correcto según `subscription_status`:
  - `trial` → badge ámbar con días restantes (basado en `trial_ends_at`).
  - `active` → sin banner.
  - `suspended` / `cancelled` → banner rojo con CTA de soporte.
- [ ] El campo `trial_ends_at` existe en la tabla `boxes` y está poblado para todos los boxes.
- [ ] El tab "Suscripción" en `/settings` muestra el plan actual y fecha de fin de trial.
- [ ] El tab "Zona de Peligro" en `/settings` permite cambiar el slug con validación y reautenticación.
- [ ] "Pausar Box" en Danger Zone actualiza `subscription_status = 'suspended'` correctamente.
- [ ] Un admin NO puede cambiar `subscription_status` a `'active'` o `'trial'` (protegido por RLS).
- [ ] Todos los textos usan claves i18n; no hay strings hardcodeadas en español en el JSX.
- [ ] El código no introduce vulnerabilidades: inputs sanitizados, RLS respetado, no se exponen datos de otros boxes.

---

## 6. Implementation Notes & Constraints

### Patterns to Follow

- **Renderizado condicional por rol**: Usar `isAdmin` del `AuthContext` (no hacer query adicional a DB). Valor ya verificado al login.
  ```tsx
  const { isAdmin, currentBox } = useAuth();
  // ...
  {isAdmin && <Tab value="operaciones">...</Tab>}
  ```

- **Carga de métricas en paralelo**: Usar `Promise.all` para no serializar las 4 queries de KPI.
  ```tsx
  useEffect(() => {
    if (!isAdmin || !currentBox) return;
    const load = async () => {
      const [revenue, members, sessions, alerts] = await Promise.all([
        fetchRevenue(currentBox.id),
        fetchNewMembers(currentBox.id),
        fetchTodaySessions(currentBox.id),
        fetchAlerts(currentBox.id),
      ]);
      // set state...
    };
    load();
  }, [isAdmin, currentBox?.id]);
  ```

- **Error isolation por card**: Cada helper de fetch devuelve `{ data, error }` (patrón Supabase). Cada KpiCard tiene su propio `error: boolean`. Un error no cancela los demás.

- **Dialog in-situ**: Usar patrón de `useState(false)` para controlar apertura del dialog. No crear rutas nuevas para Quick Actions.

- **Validación de slug en cliente**: Validar con regex `/^[a-z0-9][a-z0-9-]{2,49}$/` antes de enviar. Luego verificar disponibilidad en DB (SELECT).

- **Reautenticación**: `supabase.auth.reauthenticate()` lanza un flow de re-login. En email/password, esto requiere que el usuario reingrese su contraseña. Manejar el callback en la misma página.

- **Tailwind / CSS Variables**: Usar clases semánticas (`bg-card`, `text-muted-foreground`, `border-border`) para respetar el sistema de temas. No hardcodear colores hex.

### Known Risks / Gotchas

- **Race condition en AuthContext**: `currentBox` puede ser `null` brevemente al montar. Siempre guarda con `if (!currentBox) return` en los `useEffect` de carga de métricas.

- **Cambio de slug rompe la URL del box**: Después de cambiar el slug en Danger Zone, el subdominio `{old-slug}.boxora.website` deja de funcionar. El admin debe ser advertido con un mensaje explícito antes de confirmar: "Tu URL del box cambiará a `{new-slug}.boxora.website`. La URL anterior dejará de funcionar."

- **RLS para "Pausar Box"**: La policy actual en `boxes` probablemente NO permite que el admin haga UPDATE. Hay que agregar una policy explícita (Module 1) que permita al admin hacer UPDATE de `subscription_status` solo al valor `'suspended'` en su propio box. Esto requiere una función `check` en la policy de Postgres.

- **Tabs en Settings**: El componente `Tabs` de Radix espera que `TabsTrigger` y `TabsContent` sean hijos directos del `Tabs`. Usar renderizado condicional dentro de `TabsList` con fragmentos es seguro, pero verificar que el `defaultValue` no apunte a un tab inexistente para el rol actual.

- **`recharts` en KPI cards**: Para los sparklines del mes en KpiCard, recharts necesita datos de serie de tiempo. El fetch de métricas debe devolver datos agrupados por día/semana, no solo el total. Esto aumenta complejidad del query. Para el MVP, los KPI cards pueden mostrar solo el total mensual sin gráfico de tendencia (el sparkline se puede agregar en iteración futura).

### External Dependencies

| Package | Version | Reason |
|---|---|---|
| `recharts` | `^2.x` (ya instalado) | KPI charts — solo si se implementan sparklines en MVP |
| `@radix-ui/react-tabs` | ya instalado | Tabs en dashboard y settings |
| `@radix-ui/react-dialog` | ya instalado | Quick action modals y confirmaciones |
| `lucide-react` | ya instalado | Iconografía en KpiCard y AlertsPanel |
| `react-i18next` | ya instalado | Claves i18n del panel admin |

Sin dependencias nuevas; todo el stack ya está presente.

---

## 7. Open Questions

> Todas las preguntas fueron respondidas durante el brainstorm. Se documenta la decisión tomada.

- [x] **¿Qué define "fin del trial"?** → Se agrega columna explícita `trial_ends_at` a la tabla `boxes`. Se popula como `created_at + 30 days` para boxes existentes. — *Resuelto*
- [x] **¿Quick Actions abren Dialogs in-situ o navegan?** → Dialogs in-situ. — *Resuelto*
- [x] **¿El upgrade de plan tiene destino concreto?** → Placeholder (`mailto:` o texto "Contactar soporte") para el MVP. — *Resuelto*
- [x] **¿Puede el admin pausar su propio box?** → Sí. Se agrega RLS policy que permite UPDATE a `'suspended'` únicamente. Solo el superadmin puede reactivar. — *Resuelto*
- [x] **¿Métricas en tiempo real?** → No. Fetch al montar el componente, sin Realtime. — *Resuelto*
- [x] **¿El receptionist ve las tabs de admin?** → No. Solo `role_id === 'admin'` accede a las tabs de Operaciones, Mi Box, Suscripción y Zona de Peligro. — *Resuelto*

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-03-03 | Claude Code Agent | Initial draft from brainstorm panel-administrativo |
