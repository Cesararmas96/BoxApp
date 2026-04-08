# Brainstorm: Movement Media Library

**Date**: 2026-04-07
**Author**: Claude (Agent)
**Status**: exploration
**Recommended Option**: Option A

---

## Problem Statement

BoxApp tiene 150+ movimientos en la base de datos pero la cobertura visual es incompleta:
- **75 SVGs/PNGs** en `/public/movements/` (iconos planos, no demostrativos)
- **~35 fotos reales** via Pexels en `movementImages.ts`
- **0 videos de demostración** poblados en `demo_url`
- Muchos movimientos caen al fallback genérico de categoría

Los atletas y coaches necesitan **ver cómo se ejecuta el movimiento** (GIF animado o video) para entender la forma correcta, especialmente movimientos técnicos como Olympic lifts y gymnastics.

**Afectados**: Atletas (visualizar forma), Coaches (enseñar), Admins (catálogo profesional).

## Constraints & Requirements

- Debe ser **gratis o muy bajo costo** (proyecto en etapa temprana)
- No depender de un servicio que pueda desaparecer — tener fallback local
- Respetar la arquitectura multi-tenant existente (`box_id` scoping)
- Mantener el sistema de prioridad actual: `custom upload > API > SVG > category default`
- Las imágenes/GIFs deben cachearse para no depender de uptime externo
- Debe cubrir al menos los movimientos de CrossFit principales (~80+ de los 150)

---

## Options Explored

### Option A: ExerciseDB via RapidAPI + Cache en Supabase Storage

Usar la API de ExerciseDB (RapidAPI free tier: 1,000 req/hr) para hacer un **seed único** que descargue GIFs animados y metadata de todos los movimientos, almacenándolos en Supabase Storage para uso permanente.

**Flujo:**
1. Script Node.js que itera los 150+ movimientos de la DB
2. Para cada uno, busca en ExerciseDB via fuzzy search (`/exercises/search?search=deadlift`)
3. Descarga el GIF 480p y lo sube a Supabase Storage (`movements-media/{slug}.gif`)
4. Actualiza `image_url` y/o `demo_url` en la tabla `movements`
5. Se ejecuta UNA VEZ (o periódicamente para nuevos movimientos)

✅ **Pros:**
- GIFs animados mostrando el movimiento completo (mejor que fotos estáticas)
- 1,300+ ejercicios con excelente cobertura CrossFit
- Una vez descargado, no hay dependencia del API — media vive en Supabase Storage
- Fuzzy search facilita el matching por nombre
- Multi-resolución disponible (360p, 480p, 720p, 1080p)

❌ **Cons:**
- Free tier de RapidAPI puede cambiar sus límites
- URLs de media rotan semanalmente (por eso hay que descargar, no linkear)
- Requiere matching manual para nombres que no coincidan (ej: "Clean & Jerk" vs "barbell clean and jerk")
- GIFs son pesados (~1-5MB cada uno) — costo de storage en Supabase

📊 **Effort:** Medium

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `exercisedb` (RapidAPI) | Fuente de GIFs y metadata | Free: 1,000 req/hr |
| `@supabase/supabase-js` | Upload a Storage | Ya instalado |
| `node-fetch` / `fetch` | Descarga de GIFs | Built-in en Node 18+ |

🔗 **Existing Code to Reuse:**
- `src/lib/movementImages.ts` — agregar ExerciseDB como fuente en la cadena de prioridad
- `src/lib/videoEmbed.ts` — ya soporta URLs directas de video
- `supabase/migrations/20260215_full_crossfit_movements.sql` — lista maestra de movimientos para matching

---

### Option B: Free Exercise DB (Dataset estático de GitHub)

Usar el dataset open-source de [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) que contiene 800+ ejercicios con imágenes estáticas (PNG) en un repositorio Git. Sin API, sin rate limits.

**Flujo:**
1. Clonar el repo o descargar el JSON + imágenes
2. Script que mapea nombres de movimientos a los del dataset
3. Copiar imágenes relevantes a `/public/movements/` o Supabase Storage
4. Actualizar `image_url` en la tabla

✅ **Pros:**
- 100% gratis, sin API, sin rate limits, sin vendor lock-in
- Licencia dominio público (ODC-ODbL)
- 800+ ejercicios con 2 imágenes cada uno (posición inicio/fin)
- Control total del dataset — se puede personalizar
- Sin dependencia de servicios externos

❌ **Cons:**
- Solo imágenes estáticas (PNG) — NO GIFs animados, NO videos
- Cobertura CrossFit moderada — faltan kipping variations, wall balls, algunos Olympic lifts
- Imágenes estilo gym genérico, no tan visual como GIFs animados
- Requiere matching manual de nombres (dataset en inglés)

📊 **Effort:** Low

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `free-exercise-db` (GitHub) | Dataset JSON + PNGs | Public domain, 800+ exercises |
| Script Node.js local | Matching y copia | One-time execution |

🔗 **Existing Code to Reuse:**
- `src/lib/movementImages.ts` — reemplazar Pexels URLs con imágenes locales
- `movements_master.json` — ya tiene 130+ movimientos, útil para cross-reference

---

### Option C: Híbrido — wger.de API + YouTube Embeds manuales

Usar wger.de (completamente open source, sin auth) para metadata e imágenes anatómicas, combinado con YouTube embeds curados manualmente para los movimientos principales.

**Flujo:**
1. Consultar wger.de API (`/api/v2/exercise/`) para enriquecer metadata (músculos, equipo)
2. Usar las imágenes anatómicas de wger donde existan
3. Crear un JSON curado con YouTube video IDs para los ~80 movimientos CrossFit principales
4. `videoEmbed.ts` ya soporta YouTube embeds

✅ **Pros:**
- wger.de es 100% gratuito y open source (AGPL-3.0)
- Videos de YouTube son la mejor calidad (canales oficiales de CrossFit, Catalyst Athletics)
- El sistema de embed ya existe en `videoEmbed.ts`
- Metadata de músculos/equipo enriquece la experiencia

❌ **Cons:**
- wger tiene cobertura de imágenes ESCASA — muchos ejercicios sin imagen
- Curar 80+ YouTube URLs es trabajo manual significativo
- Los videos de YouTube pueden ser eliminados (link rot)
- Dependencia de YouTube para los videos
- Imágenes anatómicas no son tan atractivas visualmente

📊 **Effort:** High (por la curación manual de videos)

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `wger.de` API | Metadata + imágenes anatómicas | Free, no auth, self-hostable |
| YouTube embeds | Videos de demostración | Curados manualmente |

🔗 **Existing Code to Reuse:**
- `src/lib/videoEmbed.ts` — ya parsea YouTube URLs y genera embeds
- `src/lib/movementImages.ts` — fallback chain existente
- `src/pages/Movements.tsx` — ya tiene tabs para imagen y video

---

### Option D: Generación con IA (DALL-E / Stable Diffusion)

Generar imágenes ilustrativas de cada movimiento usando modelos de IA, almacenándolas localmente.

✅ **Pros:**
- Estilo visual consistente y personalizable
- Control total sobre el output
- Sin problemas de licencia

❌ **Cons:**
- Costo de generación (DALL-E no es gratis para 150+ imágenes)
- Calidad inconsistente para movimientos técnicos (IA puede generar poses incorrectas)
- No genera GIFs animados ni videos
- Requiere revisión humana de cada imagen
- Riesgo de mostrar forma INCORRECTA de un movimiento

📊 **Effort:** High

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| OpenAI DALL-E API | Generación de imágenes | ~$0.04/imagen (1024x1024) |
| Stable Diffusion | Alternativa local | Requiere GPU |

🔗 **Existing Code to Reuse:**
- `src/lib/movementImages.ts` — almacenar URLs generadas

---

## Recommendation

**Option A (ExerciseDB + Cache en Supabase Storage)** es la recomendada porque:

1. **GIFs animados** son objetivamente superiores a fotos estáticas para demostrar movimientos — muestran el rango completo de movimiento
2. **Seed único** elimina la dependencia continua del API — una vez descargados, los GIFs viven en tu Supabase Storage
3. **1,300+ ejercicios** con la mejor cobertura de CrossFit entre todas las opciones
4. El esfuerzo es **Medium** pero el resultado es significativamente mejor que las opciones Low-effort
5. El free tier (1,000 req/hr) es más que suficiente para un seed de 150 movimientos

**Tradeoff aceptado:** Los GIFs son pesados (1-5MB), pero al almacenarlos en Supabase Storage se sirven desde CDN con buen rendimiento. Se puede optimizar usando WebP o compresión posterior.

---

## Feature Description

### User-Facing Behavior

- **Catálogo de Movimientos**: cada movimiento muestra un GIF animado como imagen principal (en lugar del SVG estático actual)
- **Tab de Video**: si el movimiento tiene `demo_url`, se muestra el embed de video en la pestaña existente
- **Fallback graceful**: si no hay GIF de ExerciseDB → foto Pexels → SVG local → icono de categoría
- **Sin cambios en UI**: la interfaz de `Movements.tsx` ya soporta imágenes y videos — solo se enriquece el contenido

### Internal Behavior

1. **Script de Seed** (`scripts/seed-movement-media.ts`):
   - Lee todos los movimientos de la tabla `movements`
   - Para cada uno sin `image_url` custom, busca en ExerciseDB por nombre (fuzzy search)
   - Descarga el GIF 480p y lo sube a Supabase Storage bucket `movement-media`
   - Actualiza `image_url` con la URL pública del storage
   - Genera un reporte de matching (encontrados, no encontrados, ambiguos)

2. **Actualización de `movementImages.ts`**:
   - Nuevo nivel de prioridad: `custom upload > Supabase Storage GIF > Pexels > SVG > default`
   - La función `resolveMovementImage()` chequea si hay un GIF en storage antes de caer al Pexels/SVG

3. **Matching Strategy**:
   - Primer paso: match exacto por nombre normalizado
   - Segundo paso: fuzzy search con threshold 0.4
   - Tercer paso: match manual para los que no resuelvan (mapping JSON)

### Edge Cases & Error Handling

- **Movimiento sin match**: queda con el fallback actual (Pexels/SVG/default) — no se pierde nada
- **GIF corrupto/no descarga**: log del error, skip, mantener imagen actual
- **Nombre ambiguo** (ej: "Clean" matchea con "barbell clean", "dumbbell clean", etc.): priorizar barbell por defecto para CrossFit
- **Rate limit de RapidAPI**: el script incluye delay entre requests (100ms) y retry con backoff
- **Storage lleno**: los GIFs 480p de 150 movimientos ~300-750MB — dentro del free tier de Supabase (1GB)
- **Movimientos custom por box**: no se tocan — el seed solo afecta movimientos globales (box_id = NULL)

---

## Capabilities

### New Capabilities
- `movement-media-seed`: Script de población masiva de GIFs desde ExerciseDB a Supabase Storage
- `movement-media-resolve`: Resolución mejorada de imágenes con GIFs animados como fuente primaria

### Modified Capabilities
- `movement-display`: La visualización existente en Movements.tsx usa GIFs en lugar de SVGs estáticos
- `movement-images`: El módulo `movementImages.ts` agrega Supabase Storage como nivel de prioridad

---

## Impact & Integration

| Affected Component | Impact Type | Notes |
|---|---|---|
| `src/lib/movementImages.ts` | modifies | Agregar Supabase Storage GIF como nivel de prioridad |
| `src/pages/Movements.tsx` | minimal | Sin cambios de código — se beneficia automáticamente de mejores imágenes |
| `src/components/TodayWod.tsx` | minimal | Muestra GIFs en lugar de SVGs via `resolveMovementImage` |
| `src/components/WODDesigner.tsx` | minimal | Thumbnails mejorados en el designer |
| Supabase Storage | extends | Nuevo bucket `movement-media` para GIFs |
| `package.json` | no change | Usa fetch nativo, no necesita deps nuevas |

---

## Open Questions

- [ ] Confirmar que el free tier de RapidAPI ExerciseDB sigue activo y sus límites exactos — *Owner: Cesar*
- [ ] Definir si se quiere WebP en lugar de GIF para reducir tamaño (~60% menos) — *Owner: Cesar*
- [ ] Revisar si MuscleWiki ($5/mes) vale la pena para los videos de alta calidad como complemento — *Owner: Cesar*
- [ ] Decidir si el seed corre como migration de Supabase o como script standalone — *Owner: Cesar*
- [ ] Mapeo manual de los ~20 movimientos que probablemente no resuelvan por fuzzy search — *Owner: Cesar*
