# Feature Specification: Athlete Today WOD

**Feature ID**: FEAT-008
**Date**: 2026-04-07
**Author**: Claude Agent
**Status**: approved
**Target version**: 1.x.x

---

## 1. Motivation & Business Requirements

> El atleta abre la app y solo ve un mensaje motivacional genérico. Tiene que navegar a `/wods` o `/schedule` para ver su entrenamiento del día. Esto genera fricción y reduce la experiencia del usuario.

### Problem Statement

El `AthleteDashboard` actual muestra 3 cards estáticos:
1. **"Today's Mission"** — texto motivacional que dice "Check the WOD section" (no muestra el WOD real)
2. **"Personal Progress"** — PRs en últimos 30 días
3. **"Attendance"** — porcentaje de asistencia

El atleta debe navegar a `/wods` o `/schedule` para ver la programación del día. La información más importante (qué voy a entrenar hoy) no está en la pantalla principal.

### Goals
- El atleta ve el WOD de hoy **inmediatamente** al abrir la app (sin navegación adicional)
- Los movimientos se muestran de forma **visual** (imágenes/iconos, no solo texto)
- Se muestran las **opciones de scaling** para que el atleta sepa cómo adaptar el entrenamiento
- Si hay múltiples **tracks** (CrossFit, Novice, Bodybuilding, Engine), el atleta puede alternar entre ellos
- Experiencia **mobile-first** consistente con el diseño existente

### Non-Goals (explicitly out of scope)
- NO se implementa logging de resultados desde el dashboard (eso se mantiene en `/wods`)
- NO se permite editar/crear WODs desde el dashboard (flujo de coach/admin)
- NO se agregan notificaciones push para nuevos WODs
- NO se modifica la vista de coach o admin

---

## 2. Architectural Design

### Overview

Se crea un componente `TodayWod` que se embebe dentro del `AthleteDashboard` existente, reemplazando el card motivacional "Today's Mission". El componente es **read-only** y consulta directamente Supabase usando las RLS policies existentes (athletes ya pueden `SELECT` de `wods` y `movements`).

### Component Diagram
```
AthleteDashboard
├── TodayWod (NEW - reemplaza "Today's Mission" card)
│   ├── TrackSelector (pills horizontales, condicional)
│   ├── WodStructureDisplay (session blocks renderizados)
│   │   └── MovementRow (por cada BlockItem)
│   │       ├── MovementImage (resolveMovementImage())
│   │       ├── MovementName + category badge
│   │       └── Reps/Weight pill
│   ├── StimulusSection
│   └── ScalingCollapsible (beginner/intermediate/advanced/injured)
├── PersonalProgress Card (sin cambios)
└── Attendance Card (sin cambios)
```

### Integration Points

| Existing Component | Integration Type | Notes |
|---|---|---|
| `AthleteDashboard.tsx` | modifies | Reemplaza card "Today's Mission" con `<TodayWod />` |
| `resolveMovementImage()` | uses | De `src/lib/movementImages.ts` para imágenes de movimientos |
| `useAuth()` | uses | Para `currentBox` y `user` |
| `useLanguage()` | uses | Para traducciones i18n |
| `supabase` | uses | Queries a `wods` y `movements` tables |
| `Card`, `Badge`, `Button` | uses | Componentes shadcn/ui existentes |

### Data Models
```typescript
// Ya existente en Wods.tsx - se reutiliza
interface SessionBlock {
  id: string;
  title: string;
  sets?: string;
  items: BlockItem[];
}

interface BlockItem {
  id: string;
  movementName: string;
  reps?: string;
  weight?: string;
  notes?: string;
  sets?: string;
}

// WOD simplificado para el componente TodayWod
interface TodayWodData {
  id: string;
  title: string;
  date: string;
  track: 'CrossFit' | 'Novice' | 'Bodybuilding' | 'Engine';
  metcon: string;
  stimulus: string;
  scaling_options: string;
  scaling_beginner: string;
  scaling_intermediate: string;
  scaling_advanced: string;
  scaling_injured: string;
  modalities: string[];
  structure: SessionBlock[];
}

// Movement del box para resolver imágenes
interface BoxMovement {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  demo_url: string | null;
}
```

---

## 3. Module Breakdown

### Module 1: TodayWod Component
- **Path**: `src/components/TodayWod.tsx`
- **Responsibility**: Componente principal que muestra el WOD del día en el dashboard del atleta
- **Depends on**: ninguno (componente nuevo)
- **Sub-responsabilidades**:
  - Fetch WODs de hoy + movements del box (en paralelo con `Promise.all`)
  - Track selector (pills horizontales) — solo visible si hay >1 track con WOD hoy
  - Renderizar session blocks (`wod.structure[]`) con el patrón visual de `Schedule.tsx:677-700`
  - Para cada `BlockItem`: mostrar imagen del movimiento via `resolveMovementImage()`, nombre, reps/weight
  - Si el movimiento tiene `demo_url` en la tabla `movements`, hacer clickeable para abrir demo
  - Sección de stimulus
  - Scaling colapsable con los 4 niveles (beginner/intermediate/advanced/injured)
  - Empty state para días sin WOD (mensaje de descanso + link a `/schedule`)
  - Fallback: si `structure` vacío pero `metcon` existe, renderizar como texto pre-formateado
  - Timezone: usar `new Date().toLocaleDateString('en-CA')` para YYYY-MM-DD en timezone local

### Module 2: AthleteDashboard Integration
- **Path**: `src/components/AthleteDashboard.tsx`
- **Responsibility**: Integrar `TodayWod` reemplazando el card motivacional
- **Depends on**: Module 1

### Module 3: i18n Keys
- **Path**: `src/locales/en.json`, `src/locales/es.json`
- **Responsibility**: Traducciones para las nuevas cadenas del componente
- **Depends on**: ninguno

---

## 4. Test Specification

### Manual Tests (Frontend visual)
| Test | Module | Description |
|---|---|---|
| WOD de hoy visible | Module 1 | Login como athlete, verificar que el dashboard muestra el WOD del día con bloques |
| Imágenes de movimientos | Module 1 | Verificar que cada movimiento muestra imagen (Pexels/SVG/default) |
| Track selector | Module 1 | Crear WODs en 2+ tracks para el mismo día, verificar que el selector aparece y funciona |
| Scaling toggle | Module 1 | Verificar que el botón de scaling expande/colapsa los niveles |
| Empty state | Module 1 | Verificar día sin WOD muestra mensaje de descanso |
| Fallback metcon | Module 1 | WOD sin `structure` pero con `metcon` muestra texto formateado |
| Responsive | Module 1 | Verificar layout correcto en mobile (375px) y desktop |
| i18n | Module 3 | Cambiar idioma a español, verificar traducciones |

### Build Verification
| Test | Description |
|---|---|
| TypeScript build | `npm run build` pasa sin errores |
| ESLint | `npm run lint` sin warnings nuevos |

### Test Credentials
- **Athlete**: `athlete1@iron-box.seed` / `Seed@2024!`
- **URL**: `http://localhost:5173/login?box=iron-box`

---

## 5. Acceptance Criteria

> This feature is complete when ALL of the following are true:

- [ ] El `AthleteDashboard` muestra el WOD de hoy inline (no el mensaje motivacional genérico)
- [ ] Los session blocks (warmup, strength, wod, conditioning, accessory, cooldown) se renderizan correctamente
- [ ] Cada movimiento muestra una imagen visual (resolveMovementImage pipeline)
- [ ] Si hay múltiples tracks para hoy, aparece un selector de track funcional
- [ ] Las opciones de scaling se muestran en formato colapsable con colores por nivel
- [ ] El stimulus del WOD es visible
- [ ] Días sin WOD muestran un empty state elegante con link a `/schedule`
- [ ] WODs sin `structure` pero con `metcon` muestran el texto como fallback
- [ ] Todas las cadenas de texto están en i18n (en + es)
- [ ] `npm run build` compila sin errores TypeScript
- [ ] Layout responsive funcional en mobile y desktop
- [ ] No se rompen las vistas de coach ni admin

---

## 6. Implementation Notes & Constraints

### Patterns to Follow
- **Fetch pattern**: `useEffect` + `supabase.from()` como en `Schedule.tsx:107-153` y `Wods.tsx:117-177`
- **Block rendering**: Patrón exacto de `Schedule.tsx:677-700` para iterar `wod.structure[]`
- **Scaling display**: Patrón de `Schedule.tsx:726-748` con colores por nivel
- **Image resolution**: `resolveMovementImage(name, customUrl, category)` de `src/lib/movementImages.ts`
- **Styling**: `glass` cards, `font-black uppercase italic tracking-tight` headings, `rounded-2xl`, `bg-muted/50 border border-border`
- **i18n**: Reusar keys existentes (`wods.block_warmup`, `wods.block_strength`, etc.) donde aplique

### Known Risks / Gotchas
- **Timezone**: `new Date().toISOString().split('T')[0]` puede dar el día incorrecto cerca de medianoche. Usar `new Date().toLocaleDateString('en-CA')` que produce YYYY-MM-DD en timezone local
- **WODs sin structure**: WODs legacy solo tienen `metcon` como texto plano. El fallback debe cubrir esto
- **Imágenes pesadas**: Pexels URLs cargan imágenes externas. Usar `loading="lazy"` en `<img>` tags
- **Track sin WOD hoy**: Si el box no tiene WOD programado para hoy, mostrar empty state (no card roto)

### External Dependencies
Ninguna nueva — todo usa dependencias existentes del proyecto.

---

## 7. Open Questions

- [x] ¿Se necesitan cambios de DB/RLS? — **No**, athletes ya pueden `SELECT` de `wods` y `movements`
- [ ] ¿Debería el componente mostrar también la hora de la sesión/clase del día? — *Decidir si integrar info de `sessions` table o mantener solo WOD*
- [ ] ¿Añadir un botón "Log Result" directo al WOD del día? — *Marcado como non-goal por ahora, pero podría ser una mejora futura*

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-04-07 | Claude Agent | Initial draft |
