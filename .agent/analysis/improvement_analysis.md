# 🔍 Análisis de Mejoras — BoxApp

> **Fecha:** 2026-02-19  
> **Stack:** React 18 + TypeScript + Vite 4 + Supabase + TailwindCSS 3 + Radix UI  
> **Deployment:** Vercel  

---

## 📊 Resumen Ejecutivo

BoxApp es una aplicación SaaS multi-tenant para gestión de **CrossFit Boxes** con módulos de miembros, WODs, competencias, facturación, programación y más. Tras el análisis del código fuente se identificaron **42 oportunidades de mejora** agrupadas en 7 categorías con prioridades.

| Categoría | Críticas 🔴 | Altas 🟠 | Medias 🟡 | Bajas 🟢 |
|---|---|---|---|---|
| Arquitectura & Estructura | 2 | 3 | 2 | 1 |
| Performance | 1 | 3 | 2 | — |
| **Seguridad** | **3** | 2 | 1 | — |
| Calidad de Código | 1 | 3 | 3 | 2 |
| Testing | 1 | 1 | — | — |
| Developer Experience | — | 2 | 2 | — |
| UX/UI | — | 1 | 2 | 1 |

---

## 1. 🏗️ Arquitectura & Estructura de Código

### 🔴 1.1 Páginas Monolíticas (GOD Components)

**Problema:** Varios componentes de página son excesivamente grandes y contienen toda la lógica de negocio, estado, queries a Supabase, y JSX en un solo archivo:

| Archivo | Líneas | Tamaño |
|---|---|---|
| `Billing.tsx` | 1,777 | 107 KB |
| `Wods.tsx` | 1,165 | 72 KB |
| `Schedule.tsx` | 1,003 | 66 KB |
| `Members.tsx` | 1,005 | 59 KB |
| `Leads.tsx` | 992 | 59 KB |
| `Settings.tsx` | 844 | 50 KB |
| `Movements.tsx` | 665 | 37 KB |

**Impacto:** Mantenimiento costoso, re-renders innecesarios, imposible reusar lógica.

**Solución propuesta:** Aplicar el patrón **Feature Folder** → dividir cada módulo en:
```
src/features/billing/
  ├── components/
  │   ├── BillingTable.tsx
  │   ├── InvoiceForm.tsx
  │   └── PaymentHistory.tsx
  ├── hooks/
  │   ├── useBillingData.ts
  │   └── useBillingMutations.ts
  ├── types.ts
  └── index.tsx          ← orquestador ligero
```

---

### 🔴 1.2 Ausencia de Capa de Datos (Data Layer)

**Problema:** Todas las páginas hacen llamadas directas a `supabase.from(...)` dentro de `useEffect`. No hay abstracción de repositorio ni capa de servicios. Esto:
- Acopla la UI directamente a Supabase
- Dificulta migrar a otra API o agregar caché
- Imposibilita hacer mocking para tests

**Archivos afectados:** 8 de 20 páginas acceden directamente a Supabase.

**Solución propuesta:** Crear una capa de servicios:
```
src/services/
  ├── billingService.ts
  ├── membersService.ts
  ├── wodsService.ts
  └── ...
```
Y custom hooks que encapsulen cada query:
```typescript
// src/hooks/queries/useMembers.ts
export function useMembers(boxId: string) {
  const [data, setData] = useState<Member[]>([]);
  // ...fetch logic encapsulada
}
```
**Ideal a futuro:** Adoptar **TanStack Query (React Query)** para caché automático, refetch, stale-while-revalidate y deduplicación de requests.

---

### 🟠 1.3 Falta de Lazy Loading en Rutas

**Problema:** `App.tsx` importa **todas** las 20 páginas de forma síncrona (eager imports). Esto hace que el bundle inicial sea extremadamente pesado.

```tsx
// Estado actual — todas cargadas de golpe
import { Members } from './pages/Members';
import { Billing } from './pages/Billing';
import { Wods } from './pages/Wods';
// ... 17 imports más
```

**Solución propuesta:**
```tsx
import { lazy, Suspense } from 'react';

const Members = lazy(() => import('./pages/Members'));
const Billing = lazy(() => import('./pages/Billing'));

// En rutas:
<Suspense fallback={<PageSkeleton />}>
  <Route path="/members" element={<Members />} />
</Suspense>
```

---

### 🟠 1.4 Lógica Duplicada: Favicon + Title

**Problema:** La lógica de actualización de `document.title` y favicon se repite en **2 lugares**:
- `App.tsx` (líneas 32-57)
- `MainLayout.tsx` (líneas 48-72)

**Solución:** Centralizar en un custom hook `useDocumentMeta(currentBox, location)`.

---

### 🟠 1.5 Ausencia de State Management Global

**Problema:** Solo existe `AuthContext` para estado global. Toda la data de cada módulo vive en `useState` local dentro de cada página, lo que:
- Hace que al cambiar de página se pierda toda la data
- Regenera queries al volver a una página visitada
- No permite compartir estado entre módulos relacionados

**Solución:** Implementar un state manager ligero como **Zustand** (ya listado como opción en otro proyecto del usuario) o usar **TanStack Query** cuyo caché actúa como store global para server state.

---

### 🟡 1.6 Archivos Residuales en Raíz

**Problema:** El directorio raíz tiene archivos que no deberían estar en producción:
- `batch_1.json` (10 KB)
- `movements_list.json` (17 KB)
- `movements_master.json` (12 KB)
- `movements_to_insert.json` (30 KB)
- `sample.json` (504 B)
- `parse_wods.js` (4 KB)
- `prepare_insertion.js` (431 B)
- `seed_data.sql` (93 KB)
- `wods.md` (13 KB)
- `Necesito aplicar lo siguiente.md` (187 B)
- `src/main.tsx.bak`

**Solución:** Mover scripts a `scripts/`, datos de seed a `supabase/seed/`, eliminar `.bak` y notas personales. Agregar al `.gitignore`:
```
*.bak
*.json
!package.json
!package-lock.json
!tsconfig*.json
!components.json
```

---

### 🟡 1.7 Componentes de UI sin Organización por Dominio

**Problema:** `src/components/` mezcla componentes de dominio (`AthleteDashboard`, `CoachDashboard`, `WODDesigner`) con componentes de infraestructura (`ProtectedRoute`, `theme-provider`, `mode-toggle`).

**Solución:**
```
src/components/
  ├── ui/            ← primitivos (ya existe)
  ├── layout/        ← ProtectedRoute, MainLayout
  ├── providers/     ← ThemeProvider, AuthProvider
  └── shared/        ← ModeToggle, etc.
src/features/
  ├── dashboard/     ← AthleteDashboard, CoachDashboard
  ├── wods/          ← WODDesigner
  └── competitions/  ← todo el módulo (ya existe parcialmente)
```

---

## 2. ⚡ Performance

### 🔴 2.1 Bundle Monolítico Sin Code Splitting

**Problema:** Sin `React.lazy`, `Suspense`, `React.memo`, ni `useMemo` en ninguna parte del proyecto (salvo 3 archivos con `useMemo`). Un usuario que solo quiere ver el Dashboard carga 107 KB de lógica de Billing.

**Impacto:** First Contentful Paint lento, TTI elevado.

**Métricas estimadas de mejora:**
- Lazy loading rutas: ~60% reducción de bundle inicial
- `React.memo` en listas pesadas: ~40% reducción de re-renders

---

### 🟠 2.2 Re-renders No Controlados

**Problema:** Las páginas como `Members` (1,005 líneas) y `Billing` (1,777 líneas) no usan:
- `React.memo` para componentes hijo
- `useMemo` para cómputos derivados
- `useCallback` para handlers pasados como props

Cada actualización de estado (ej: escribir en un input de búsqueda) re-renderiza el componente entero incluyendo tablas con cientos de filas.

---

### 🟠 2.3 Queries Sin Caché Ni Deduplicación

**Problema:** Cada `useEffect` hace una query directa a Supabase sin mecanismo de caché. Si el usuario navega `/members` → `/billing` → `/members`, se hacen 2 queries idénticas a members.

**Solución:** TanStack Query proporcionaría `staleTime`, `refetchOnWindowFocus`, y query key deduplication automáticamente.

---

### 🟠 2.4 Vite/TypeScript Desactualizados

**Problema:** Versiones principales desactualizadas:
| Paquete | Actual | Última Estable |
|---|---|---|
| `vite` | 4.4.5 | 6.x |
| `@vitejs/plugin-react` | 4.0.3 | 4.3.x |
| `eslint` | 8.45.0 | 9.x |
| `@typescript-eslint/*` | 6.0.0 | 8.x |

**Impacto:** Pérdida de optimizaciones de build, vulnerabilidades conocidas, features modernas no disponibles.

---

## 3. 🔒 Seguridad

### 🔴🔴 3.0 RLS Multi-Tenant Incompleto — Potencial Fuga de Datos Entre Boxes

**Problema:** Este es el hallazgo **más crítico** del análisis. La aplicación es **multi-tenant** (múltiples CrossFit Boxes comparten la misma base de datos, aisladas por `box_id`), pero la mayoría de las políticas RLS (Row Level Security) **no filtran por `box_id`**, permitiendo que un usuario autenticado de un Box acceda a datos de otro Box.

#### Tablas con `box_id` y su estado de RLS:

| Tabla | Tiene `box_id` | RLS Habilitado | Filtra por `box_id` | Estado |
|---|---|---|---|---|
| `profiles` | ✅ | ✅ | ✅ (staff same box) | ✅ Correcto |
| `memberships` | ✅ | ✅ | ✅ (staff same box) | ✅ Correcto |
| `audit_logs` | ✅ | ✅ | ❌ (solo filtra `role=admin`) | ⚠️ Admin ve TODOS los boxes |
| `wods` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `classes` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `leads` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `expenses` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `invoices` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `plans` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `items` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `movements` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `personal_records` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `bookings` | ✅ | ❓ | ❌ Sin policy con box_id | 🔴 **FUGA** |
| `competitions` | ✅ | ✅ | ❌ No filtra box_id | 🔴 **FUGA** |
| `competition_events` | ✅ | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |
| `competition_participants` | ✅ | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |
| `competition_scores` | ✅ | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |
| `competition_judges` | — | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |
| `competition_divisions` | — | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |
| `competition_teams` | — | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |
| `competition_heats` | — | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |
| `lane_assignments` | — | ✅ | ❌ `USING (true)` para SELECT | 🔴 **FUGA** |

#### Detalle de las vulnerabilidades encontradas:

**1. Tablas sin RLS alguno (~10 tablas):**
Las tablas `wods`, `classes`, `leads`, `expenses`, `invoices`, `plans`, `items`, `movements`, `personal_records`, `bookings` **no tienen migraciones que habiliten RLS ni definan políticas**. Si RLS no está habilitado, Supabase permite acceso total a cualquier usuario autenticado.

**2. Competencias con `USING (true)` — acceso global:**
```sql
-- 20260209_fix_competitions_rls.sql
CREATE POLICY "Public can view participants" 
  ON competition_participants FOR SELECT 
  TO authenticated USING (true);  -- ← CUALQUIER usuario ve TODO

CREATE POLICY "Admins and coaches can manage participants" 
  FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() 
    AND (role_id = 'admin' OR role_id = 'coach')  -- ← Sin filtro box_id!
  ));
```
Un admin del **Box A** puede modificar competencias, scores y participantes del **Box B**.

**3. Audit logs sin aislamiento de box:**
```sql
CREATE POLICY "Admins can view all audit logs" 
  ON audit_logs FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id = 'admin'
  ));
  -- ← Un admin ve audit logs de TODOS los boxes
```

**4. Admin password reset sin aislamiento:**
```sql
-- admin_reset_password.sql
-- Solo verifica role_id = 'admin', NO verifica que el target_user
-- pertenezca al mismo box. Un admin podría resetear contraseñas
-- de usuarios de otros boxes.
```

#### Impacto:
- **Datos financieros:** Un Box puede ver facturas, gastos y planes de otro Box
- **Datos de miembros:** WODs, benchmarks, personal records expuestos cross-tenant
- **Competencias:** Scores manipulables entre boxes
- **Auditoría comprometida:** Un admin puede ver actividad de todos los tenants
- **Escalación de privilegios:** Un admin puede resetear contraseñas de otro box

#### Solución propuesta:

Crear una función helper reutilizable y aplicar a TODAS las tablas con `box_id`:

```sql
-- Función helper: obtener box_id del usuario actual
CREATE OR REPLACE FUNCTION public.current_user_box_id()
RETURNS UUID AS $$
  SELECT box_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Patrón estándar para CADA tabla con box_id:
ALTER TABLE public.wods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.wods
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.wods
  FOR INSERT TO authenticated
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_update" ON public.wods
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.wods
  FOR DELETE TO authenticated
  USING (box_id = public.current_user_box_id());
```

Para tablas de competencia sin `box_id` directo, usar JOIN a la tabla padre:
```sql
CREATE POLICY "tenant_isolation_select" ON public.competition_divisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_divisions.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );
```

Para `admin_reset_password`, agregar validación cross-tenant:
```sql
-- Verificar que target_user pertenezca al mismo box
IF NOT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = target_user_id
  AND box_id = (SELECT box_id FROM public.profiles WHERE id = auth.uid())
) THEN
  RETURN json_build_object('error', 'Cannot reset password for user outside your box');
END IF;
```

---

### 🔴 3.1 Console Logs con Información Sensible en Producción

**Problema:** El `supabaseClient.ts` y `AuthContext.tsx` imprimen datos sensibles en consola:

```typescript
// supabaseClient.ts — expone prefix del anon key
console.log('[Supabase] Anon key prefix:', supabaseAnonKey.substring(0, 10), '...');

// AuthContext.tsx — expone userId
console.log('[AuthContext] fetchProfile started for:', userId);
```

**Archivos con console.log:** `AuthContext.tsx`, `supabaseClient.ts`, `seedCompetition.ts`

**Solución:** 
1. Eliminar todos los `console.log` de producción
2. Implementar un logger condicional:
```typescript
const logger = {
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) console.log(...args);
  }
};
```

---

### 🔴 3.2 Archivo `.env` Posiblemente Trackeado

**Problema:** El archivo `.env` existe en el directorio raíz (291 bytes) pero `.gitignore` **no lo excluye explícitamente** (solo ignora `*.local`). Si `.env` fue commiteado, las credenciales de Supabase están en el historial de Git.

**Solución:** 
1. Agregar `.env` al `.gitignore`
2. Si ya estaba en el historial: `git filter-branch` o `BFG Repo-Cleaner`
3. Rotar las claves de Supabase

---

### 🟠 3.3 Uso Extensivo de `as any` (25+ archivos)

**Problema:** 25 archivos usan `as any`, lo que anula completamente el type checking de TypeScript. Esto incluye archivos críticos como `AuthContext.tsx` y `MainLayout.tsx`.

```typescript
// AuthContext.tsx — bypasses de tipos
const profileData = data as any;
const config = currentBox.theme_config as any;
```

**Impacto:** Errores en runtime que TypeScript debería capturar. Riesgo de accesos a propiedades inexistentes.

---

### 🟠 3.4 Roles Hardcodeados como Strings

**Problema:** Los roles (`admin`, `coach`, `receptionist`, `athlete`) están hardcodeados como strings por toda la app:
```tsx
<ProtectedRoute allowedRoles={['admin', 'coach', 'receptionist']}>
```

Si alguien cambia un nombre de rol en la DB, todas las protecciones fallan silenciosamente.

**Solución:** Crear un enum/constante centralizada:
```typescript
export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  RECEPTIONIST: 'receptionist',
  ATHLETE: 'athlete',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];
```

---

### 🟡 3.5 Validación Root User por Email Hardcodeado

**Problema:**
```typescript
const isRoot = session?.user?.email === 'root@test.com' || ...;
```
El email `root@test.com` está hardcodeado en `AuthContext.tsx`. Esto es un bypass de seguridad que debería manejarse con un claim o metadata de la base de datos.

---

## 4. 🧹 Calidad de Código

### 🔴 4.1 Cero Tests Automatizados

**Problema:** No existe **ningún** archivo `.test.ts`, `.test.tsx`, `.spec.ts`, ni `.spec.tsx` en todo el proyecto. Tampoco hay dependencias de testing en `package.json` (no hay Vitest, Jest, Testing Library, Cypress, ni Playwright).

**Impacto:** Cualquier refactor o cambio puede romper funcionalidad sin que nadie se entere. Zero confidence en deploys.

**Solución:** Implementar una estrategia de testing en 3 capas:
1. **Unit tests** con Vitest + React Testing Library para hooks y utilidades
2. **Component tests** para componentes UI críticos
3. **E2E tests** con Playwright para flujos principales (login, CRUD miembros)

---

### 🟠 4.2 Un Solo Context Monolítico para Auth

**Problema:** `AuthContext` maneja auth session + profile + box settings + roles + OAuth + password reset, todo en un contexto. Esto causa que **cualquier cambio** en auth re-renderice **toda** la app.

**Solución:** Separar en contextos granulares:
- `SessionContext` — solo session/user raw
- `ProfileContext` — perfil y roles del usuario
- `BoxContext` — configuración del box actual
- `AuthActionsContext` — signIn, signOut, etc. (estable, no causa re-renders)

---

### 🟠 4.3 TypeCast del Tipo `Database` con `as any`

**Problema:** Los tipos de Supabase (`src/types/supabase.ts`, 1,389 líneas) están generados pero no se aprovechan. Hay casts `as any` que bypasean la seguridad de tipos:

```typescript
// AuthContext.tsx
const boxId = (data as any).box_id;
await supabase.from('boxes' as any)... 
```

**Solución:** Corregir los tipos en `supabase.ts`, regenerar con `supabase gen types` y eliminar todos los `as any`.

---

### 🟠 4.4 Inconsistencia en Naming Conventions

**Evidencia:**
- Componentes: mix de PascalCase (`WODDesigner`) y kebab-case archivos (`mode-toggle.tsx`, `theme-provider.tsx`)
- Hooks barrel: exporta solo 3 de 4 hooks disponibles
- Props con `any`: `userProfile?: any` en `MainLayout`

---

### 🟡 4.5 `@ts-ignore` sin Justificación

```typescript
// competitions/Tabs/JudgesTab.tsx:86
// @ts-ignore
```
Cada `@ts-ignore` debería tener un comentario justificando el porqué.

---

### 🟡 4.6 ESLint Configuración Mínima

**Problema:** ESLint usa solo reglas básicas (`recommended`). No tiene:
- `plugin:react/recommended`
- `plugin:react/jsx-runtime`
- Type-aware rules (`@typescript-eslint/recommended-type-checked`)
- Import sorting
- No-unused-imports
- Prettier integration

---

### 🟡 4.7 SignUp Page Sin Uso Aparente

**Observación:** `SignUp.tsx` (267 líneas) existe pero no está referenciado en las rutas de `App.tsx`. ¿Es código muerto?

---

### 🟢 4.8 Versión de Proyecto `0.0.0`

```json
"version": "0.0.0"
```
Considerar implementar **semantic versioning** vinculado a los Conventional Commits.

---

### 🟢 4.9 README Genérico

El `README.md` es el template default de Vite. No documenta:
- Qué es la app y para quién
- Cómo configurar y ejecutar el proyecto
- Variables de entorno requeridas
- Arquitectura y decisiones de diseño
- Cómo contribuir

---

## 5. 🧪 Testing

### 🔴 5.1 Cobertura de Tests: 0%

**Impacto:** Ya documentado en 4.1. 

**Plan de testing mínimo viable:**

| Prioridad | Área | Herramienta | Scope |
|---|---|---|---|
| P0 | Auth flow (login/logout) | Vitest + RTL | Unit |
| P0 | ProtectedRoute guards | Vitest + RTL | Component |
| P1 | CRUD Members | Playwright | E2E |
| P1 | WOD creation flow | Playwright | E2E |
| P2 | Billing calculations | Vitest | Unit |
| P2 | Theme provider | Vitest + RTL | Component |

---

### 🟠 5.2 No CI/CD Pipeline

**Problema:** No hay configuración de GitHub Actions, Vercel checks, ni pre-commit hooks.

**Solución propuesta:**
```yaml
# .github/workflows/ci.yml
- Lint (ESLint)
- Type check (tsc --noEmit)
- Unit tests (Vitest)
- Build check (vite build)
- E2E tests (Playwright, en PR merge)
```

---

## 6. 🛠️ Developer Experience (DX)

### 🟠 6.1 Sin Pre-commit Hooks

**Problema:** No hay Husky, lint-staged, ni commitlint configurados. Un desarrollador puede:
- Commitear código con errores de lint
- Usar mensajes de commit que no siguen Conventional Commits
- Subir archivos `.env` accidentalmente

**Solución:** 
```bash
npx husky init
# + lint-staged para lint, format y type-check pre-commit
# + commitlint para validar mensajes
```

---

### 🟠 6.2 Sin Storybook ni Documentación Visual

**Problema:** 20 componentes UI en `src/components/ui/` sin documentación visual. Un nuevo desarrollador no sabe qué variantes existen para `Button`, `Badge`, `Dialog`, etc.

**Solución:** Storybook 8 para documentación interactiva de componentes.

---

### 🟡 6.3 Sin Path Aliases Consistentes

**Observación:** Existe `@/*` como alias, lo cual es correcto. Sin embargo, no hay Prettier configurado ni settings de VS Code compartidos para formato consistente.

---

### 🟡 6.4 Script `predev` Puede Fallar Silenciosamente

```json
"predev": "npm run db:migrate || true"
```
El `|| true` enmascara errores de migración. Un desarrollador puede ejecutar la app con un esquema desactualizado sin saberlo.

---


---

## 7. 🎨 UX/UI

### 🟠 7.1 Sin Error Boundaries

**Problema:** No hay ningún `<ErrorBoundary>` en toda la app. Si un componente falla (ej: un campo de API que cambió), toda la aplicación crashea con pantalla blanca.

**Solución:**
```tsx
// Wrapper en App.tsx y en cada feature
<ErrorBoundary fallback={<ErrorPage />}>
  <Outlet />
</ErrorBoundary>
```

---

### 🟡 7.2 Loading States Inconsistentes

Cada página implementa su propio loading state con diferentes estilos. No hay un `<PageSkeleton>` o `<LoadingState>` compartido.

---

### 🟡 7.3 Textos Hardcodeados en Inglés en ProtectedRoute

```tsx
"Synchronizing Security Clearance..."
"Access Denied: Terminal Not Identified"
"Access Restricted"
```
Estos textos no usan i18n a pesar de que el proyecto tiene soporte para ES/EN.

---

### 🟢 7.4 Sin Toast/Snackbar Global

`useNotification` existe como hook local pero no hay un provider global. Cada página que necesita notificaciones debe instanciar el hook y renderizar el componente manualmente.

---

## 📋 Plan de Acción Priorizado

### Fase 0 — Emergencia de Seguridad (INMEDIATO)
0. 🔴🔴 **Implementar RLS multi-tenant en TODAS las tablas con `box_id`**
   - Crear función `current_user_box_id()`
   - Aplicar tenant isolation a: `wods`, `classes`, `leads`, `expenses`, `invoices`, `plans`, `items`, `movements`, `personal_records`, `bookings`
   - Corregir policies de competiciones (reemplazar `USING(true)` por filtro de box)
   - Agregar validación cross-tenant a `admin_reset_password`
   - Corregir `audit_logs` para filtrar por box_id

### Fase 1 — Fundaciones (1-2 semanas)
1. ✅ Limpiar archivos residuales de raíz
2. 🔒 Asegurar `.env` en `.gitignore` + eliminar del historial
3. 🔒 Eliminar `console.log` sensibles
4. ⚡ Implementar `React.lazy` + `Suspense` en todas las rutas
5. 🏗️ Crear `ErrorBoundary` global

### Fase 2 — Arquitectura (2-3 semanas)
6. 🏗️ Crear capa de servicios (`src/services/`)
7. 🏗️ Extraer `AuthContext` en 3 contextos granulares
8. 🧹 Eliminar todos los `as any` — fortalecer tipos
9. 🧹 Centralizar roles como constantes tipadas
10. 🏗️ Refactorizar `Billing.tsx` como piloto de Feature Folder

### Fase 3 — Calidad (2-3 semanas)
11. 🧪 Configurar Vitest + React Testing Library
12. 🧪 Tests unitarios para auth, hooks, utils
13. 🧪 Configurar Playwright para E2E
14. 🛠️ Configurar Husky + lint-staged + commitlint
15. 🛠️ CI/CD pipeline en GitHub Actions

### Fase 4 — Performance & Polish (1-2 semanas)
16. ⚡ Integrar TanStack Query para data fetching
17. ⚡ `React.memo` + `useMemo` en listas pesadas
18. 🎨 Skeleton loaders compartidos
19. 🎨 i18n completo en todos los componentes
20. 📖 Reescribir README con documentación real

---

## 📈 Impacto Estimado

| Métrica | Actual (estimado) | Post-mejoras |
|---|---|---|
| Bundle inicial | ~1.5 MB | ~400 KB (-73%) |
| Time to Interactive | ~4.5s | ~1.8s (-60%) |
| Cobertura tests | 0% | ~60% |
| Archivos >500 LOC | 8 | 0 |
| `as any` usage | 25+ archivos | 0 |
| Tablas sin tenant isolation | 13+ | 0 |
| Tiempo onboarding dev | ~2 días | ~4 horas |

---

*Análisis generado el 2026-02-19. Basado en revisión estática del código fuente.*
