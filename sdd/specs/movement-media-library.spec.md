# Feature Specification: Movement Media Library

**Feature ID**: FEAT-009
**Date**: 2026-04-07
**Author**: Claude (Agent)
**Status**: approved
**Target version**: 1.3.0
**Brainstorm**: `sdd/proposals/movement-media-library.brainstorm.md`

---

## 1. Motivation & Business Requirements

### Problem Statement

BoxApp tiene 150+ movimientos en la base de datos pero la cobertura visual es incompleta:
- **75 SVGs/PNGs** en `/public/movements/` — iconos planos, no demostrativos
- **~35 fotos reales** via Pexels en `movementImages.ts`
- **0 videos de demostración** poblados en el campo `demo_url`
- Muchos movimientos caen al fallback genérico de categoría

Los atletas necesitan ver la ejecución del movimiento (GIF animado o video) para entender la forma correcta, especialmente en movimientos técnicos como Olympic lifts y gymnastics. Los coaches necesitan una referencia visual para enseñar. Los admins necesitan un catálogo profesional.

### Goals
- G1: Poblar el 80%+ de los movimientos con GIFs animados de demostración
- G2: Almacenar media en Supabase Storage para independencia del proveedor externo
- G3: Mantener el sistema de fallback graceful existente (custom > GIF > Pexels > SVG > default)
- G4: Script de seed reutilizable para poblar nuevos movimientos en el futuro
- G5: Cobertura de los movimientos principales de CrossFit (Olympic lifts, gymnastics, monostructural, accessory)

### Non-Goals (explicitly out of scope)
- NG1: Cambios en la UI de `Movements.tsx` — la página ya soporta imágenes y videos
- NG2: Upload de videos por parte de coaches/admins (ya existe en la UI actual)
- NG3: Generación de imágenes con IA
- NG4: Curación manual de YouTube URLs
- NG5: Modificación de movimientos custom por box (solo se afectan globales con `box_id = NULL`)

---

## 2. Architectural Design

### Overview

Seed script de Node.js/TypeScript que conecta con ExerciseDB (RapidAPI) para descargar GIFs animados de ejercicios, los sube a Supabase Storage y actualiza la tabla `movements`. Una actualización menor a `movementImages.ts` agrega Supabase Storage GIFs como nuevo nivel de prioridad en la cadena de resolución de imágenes.

### Component Diagram
```
┌─────────────────────┐
│  seed-movement-      │
│  media.ts (script)   │
└──────┬──────────────┘
       │
       ├──→ ExerciseDB API (RapidAPI)
       │      fuzzy search by name
       │      download GIF 480p
       │
       ├──→ Supabase Storage
       │      bucket: movement-media
       │      upload GIF as {slug}.gif
       │
       └──→ Supabase DB (movements table)
              update image_url → storage public URL

┌─────────────────────┐
│  movementImages.ts   │  (runtime — modificado)
│  resolveMovementImage│
└──────┬──────────────┘
       │  Priority chain:
       │  1. custom upload (image_url custom)
       │  2. Supabase Storage GIF ← NUEVO
       │  3. Pexels realistic photo
       │  4. SVG local icon
       │  5. Category default
```

### Integration Points

| Existing Component | Integration Type | Notes |
|---|---|---|
| `src/lib/movementImages.ts` | modifies | Agregar storage GIF como nivel 2 de prioridad |
| `src/lib/videoEmbed.ts` | uses (sin cambios) | Ya soporta URLs directas si se puebla `demo_url` |
| `src/pages/Movements.tsx` | minimal (sin cambios) | Se beneficia automáticamente via `resolveMovementImage` |
| `src/components/TodayWod.tsx` | minimal (sin cambios) | Muestra GIFs via la misma función |
| `src/components/WODDesigner.tsx` | minimal (sin cambios) | Thumbnails mejorados |
| Supabase Storage | extends | Nuevo bucket `movement-media` |
| `supabase/migrations/` | extends | Migration para crear bucket y policies |
| `movements` table | uses | Lee nombres, actualiza `image_url` |

### Data Models

```sql
-- Tabla existente (no se modifica schema)
movements (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT,          -- Weightlifting, Gymnastics, Monostructural, Accessory, Other
  description TEXT,
  image_url   TEXT,          -- ← se actualiza con URL de Supabase Storage
  demo_url    TEXT,          -- ← se actualiza con video URL si disponible
  video_url   TEXT,
  box_id      TEXT,
  created_at  TIMESTAMPTZ
)

-- Nuevo bucket en Supabase Storage
-- movement-media/
--   ├── back-squat.gif
--   ├── deadlift.gif
--   ├── clean-and-jerk.gif
--   └── ...
```

### Matching Strategy

```typescript
// Pseudocódigo del algoritmo de matching
interface MatchResult {
  movementId: string;
  movementName: string;
  exerciseDbId: string | null;
  exerciseDbName: string | null;
  matchType: 'exact' | 'fuzzy' | 'manual' | 'unmatched';
  gifUrl: string | null;
}

// 1. Normalizar nombre: lowercase, trim, & → and
// 2. Buscar en ExerciseDB: /exercises/search?search={name}&threshold=0.4
// 3. Si no hay match: buscar en MANUAL_MAPPING (JSON con overrides)
// 4. Si sigue sin match: marcar como 'unmatched', mantener fallback actual
```

---

## 3. Module Breakdown

### Module 1: Supabase Storage Setup
- **Path**: `supabase/migrations/2026XXXX_movement_media_bucket.sql`
- **Responsibility**: Crear bucket `movement-media` con política de acceso público para lectura
- **Depends on**: Supabase project activo

### Module 2: Movement Name Mapping
- **Path**: `scripts/movement-name-mapping.json`
- **Responsibility**: JSON con mapeo manual de nombres que no resuelven por fuzzy search (ej: "GHD Sit-Up" → "ghd sit up", "C2B" → "chest to bar pull up")
- **Depends on**: Ninguno

### Module 3: Seed Script
- **Path**: `scripts/seed-movement-media.ts`
- **Responsibility**: Script principal que orquesta el flujo completo:
  1. Leer movimientos de DB
  2. Para cada uno: buscar en ExerciseDB → descargar GIF → subir a Storage → actualizar DB
  3. Generar reporte de matching
- **Depends on**: Module 1, Module 2

### Module 4: Image Resolution Update
- **Path**: `src/lib/movementImages.ts` (modificación)
- **Responsibility**: Agregar Supabase Storage GIF como nivel de prioridad entre custom upload y Pexels
- **Depends on**: Module 1 (bucket debe existir)

### Module 5: Seed Report
- **Path**: `scripts/seed-movement-media.ts` (output)
- **Responsibility**: Generar `scripts/seed-report.json` con estadísticas de matching:
  - Total movimientos procesados
  - Matched (exact / fuzzy / manual)
  - Unmatched (listado de nombres para revisión)
  - Errores de descarga/upload
- **Depends on**: Module 3

---

## 4. Test Specification

### Unit Tests
| Test | Module | Description |
|---|---|---|
| `test_slugify_names` | Module 3 | Normalización de nombres: "Clean & Jerk" → "clean-and-jerk" |
| `test_manual_mapping_valid` | Module 2 | Todas las keys del mapping JSON existen en la DB |
| `test_resolve_priority_with_storage` | Module 4 | Verifica que storage GIF tiene prioridad sobre Pexels |
| `test_resolve_fallback_no_storage` | Module 4 | Sin GIF en storage, cae a Pexels/SVG normalmente |
| `test_resolve_custom_overrides_storage` | Module 4 | Custom upload tiene prioridad sobre storage GIF |

### Integration Tests
| Test | Description |
|---|---|
| `test_seed_dry_run` | Ejecutar seed con `--dry-run` flag para verificar matching sin descargar |
| `test_storage_upload_download` | Subir un GIF de test a Storage y verificar URL pública accesible |
| `test_full_pipeline_single` | Seed completo de 1 movimiento: API → download → upload → DB update |

### Manual Verification
- [ ] Abrir `/movements` y verificar que los movimientos principales muestran GIFs animados
- [ ] Verificar que movimientos custom por box siguen mostrando su imagen custom
- [ ] Verificar que movimientos sin match muestran el fallback existente (SVG/Pexels)
- [ ] Verificar rendimiento de carga de página con GIFs (vs SVGs)

---

## 5. Acceptance Criteria

> This feature is complete when ALL of the following are true:

- [ ] Bucket `movement-media` creado en Supabase Storage con políticas de lectura pública
- [ ] Script `seed-movement-media.ts` ejecutable con `npx tsx scripts/seed-movement-media.ts`
- [ ] Al menos 80% de los 150+ movimientos globales tienen un GIF en Supabase Storage
- [ ] `resolveMovementImage()` prioriza GIF de Storage sobre Pexels/SVG
- [ ] Movimientos custom por box (box_id != NULL) NO son afectados por el seed
- [ ] Movimientos sin match en ExerciseDB mantienen el fallback actual (Pexels/SVG/default)
- [ ] Reporte de seed generado con estadísticas de matching
- [ ] Flag `--dry-run` disponible para verificar matching sin descargar
- [ ] Rate limiting implementado en el script (delay entre requests, retry con backoff)
- [ ] Sin regresiones en la UI existente de Movements, TodayWod, WODDesigner

---

## 6. Implementation Notes & Constraints

### Patterns to Follow
- Usar `slugify()` existente en `movementImages.ts` para normalizar nombres
- Mantener la cadena de prioridad de `resolveMovementImage()` — solo insertar un nivel nuevo
- Script standalone (no migration) — se ejecuta manualmente, no en deploy
- Usar `@supabase/supabase-js` con service role key para uploads (no anon key)

### Known Risks / Gotchas
- **URLs de ExerciseDB rotan semanalmente** — NUNCA linkear directamente, siempre descargar y re-subir
- **GIFs pesados (1-5MB)** — considerar lazy loading en la UI o conversión a WebP/AVIF
- **Fuzzy matching imperfecto** — "Clean" puede matchear "barbell clean", "dumbbell clean", etc. Priorizar barbell para CrossFit
- **Free tier de RapidAPI** — 1,000 req/hr, suficiente para seed de 150 movimientos pero hay que respetar rate limits
- **Storage de Supabase** — free tier 1GB, los GIFs 480p de 150 movimientos ocuparían ~300-750MB

### External Dependencies
| Package | Version | Reason |
|---|---|---|
| ExerciseDB (RapidAPI) | V1 | Fuente de GIFs animados de ejercicios |
| `@supabase/supabase-js` | `>=2.x` (ya instalado) | Upload a Storage + queries a DB |
| `tsx` | `>=4.x` | Ejecución de scripts TypeScript |

---

## 7. Open Questions

- [ ] Confirmar que el free tier de RapidAPI ExerciseDB sigue activo y sus límites exactos — *Owner: Cesar*
- [ ] Definir si se quiere WebP en lugar de GIF para reducir tamaño (~60% menos) — *Owner: Cesar*
- [ ] Decidir si el seed corre como script standalone o como migration de Supabase — *Owner: Cesar*
- [ ] Mapeo manual de los ~20 movimientos que probablemente no resuelvan por fuzzy search — *Owner: Cesar*
- [ ] Definir si se quiere un flag para re-seed (sobrescribir GIFs existentes) o solo poblar vacíos — *Owner: Cesar*

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-04-07 | Claude (Agent) | Initial draft from brainstorm Option A |
