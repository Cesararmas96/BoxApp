# Brainstorm: AI Bot Listing API Mismatch Fix

**Date**: 2026-03-03
**Author**: Claude Code
**Status**: exploration
**Recommended Option**: A

---

## Problem Statement

El componente `src/lib/components/modules/statics/ai/Index.svelte` no muestra el listado de bots porque la estructura de respuesta de la API cambió. La función `fetchBots()` (línea 253-309) espera que el endpoint `GET /api/v1/bots` devuelva un array directo (`response.filter(...)`), pero actualmente el API devuelve un objeto con la clave `"agents"`:

```json
{ "agents": [ { "chatbot_id": "...", "name": "...", ... } ] }
```

El resultado: `response.filter(...)` falla silenciosamente (o lanza error) porque `response` es un objeto, no un array. `botList` queda vacío y el usuario ve una pantalla vacía sin mensaje de error visible.

**Afectados:**
- Usuarios finales que acceden a cualquier módulo de AI (chatbot) en Navigator
- Todos los programas que usan el módulo `statics/ai`

**Por qué ahora:**
El backend actualizó el contrato de su API de bots sin comunicar el breaking change al frontend.

---

## Constraints & Requirements

- No romper el chat existente ni el historial de IndexedDB
- El campo `chatbot_id` como identificador único ya está correctamente usado en el resto del componente (líneas 61, 110, 449) — no hay que cambiarlo
- El filtrado por `permissions.programs` debe seguir funcionando igual
- Svelte 4 (no Runes de Svelte 5)
- Sin nuevas dependencias — la solución debe usar solo lo que ya existe
- La corrección debe ser mínima y atómica — no refactorizar código no relacionado
- Mantener Dark Mode y Light Mode (sin cambios de UI en esta tarea)

---

## Options Explored

### Option A: Normalizar la respuesta en `fetchBots()` con destructuring defensivo

Cambiar en `fetchBots()` la línea que asigna el array:
```
const bots = response?.agents ?? response ?? []
```
Esto extrae `response.agents` si existe; si no, usa `response` directamente (backward compatible). Luego aplica el `.filter()` sobre `bots`.

✅ **Pros:**
- Cambio quirúrgico de 1-2 líneas en un solo archivo
- Backward compatible: si en el futuro el API vuelve al formato array, sigue funcionando
- Cero riesgo de regresión en otros flujos (chat, historial, etc.)
- No requiere refactor ni nuevas abstracciones
- Fácil de entender en code review

❌ **Cons:**
- No centraliza la normalización — si otros endpoints cambian su estructura, habría que repetir el patrón

📊 **Effort:** Low

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| — | No nuevas dependencias | Solo JS nativo |

🔗 **Existing Code to Reuse:**
- `src/lib/components/modules/statics/ai/Index.svelte` línea 253-309 — función `fetchBots()` donde se aplica el fix

---

### Option B: Crear un servicio/adapter centralizado para la API de bots

Crear un archivo `src/lib/services/botsApi.ts` que encapsule todos los calls al AI API y normalice las respuestas. `fetchBots()` consumiría este servicio en lugar de llamar `getData` directamente.

✅ **Pros:**
- Centraliza la lógica de normalización
- Si el API cambia de nuevo, solo se actualiza el servicio
- Mejor separación de responsabilidades a largo plazo

❌ **Cons:**
- Esfuerzo de refactor significativamente mayor para un bug puntual
- Requiere crear un archivo nuevo y modificar múltiples llamadas en `Index.svelte`
- Mayor superficie de cambio = mayor riesgo de introducir regresiones
- Over-engineering para un ajuste de una línea

📊 **Effort:** Medium

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| — | No nuevas dependencias | TypeScript nativo |

🔗 **Existing Code to Reuse:**
- `src/lib/services/getData.ts` — función `getData` que ya maneja auth y error
- `src/lib/components/modules/statics/ai/Index.svelte` — consumidor principal

---

### Option C: Transformar la respuesta en el store o con un Svelte derived store

Crear un store reactivo que consuma el endpoint y normalice la respuesta, usando `svelte/store` con `derived` o `readable`. El componente subscribiría al store en lugar de llamar directamente a la API.

✅ **Pros:**
- Patrón reactivo nativo de Svelte
- El estado de bots podría compartirse entre múltiples componentes sin prop-drilling

❌ **Cons:**
- Requiere refactorizar cómo se carga `botList` en todo el componente
- Las funciones que dependen de `botList` (e.g., `resolvePendingFromURL`) también necesitan adaptarse
- Mucho mayor alcance que el problema original
- Los stores globales traen complejidad de lifecycle (¿cuándo se invalida el cache?)

📊 **Effort:** High

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `svelte/store` | Estado reactivo | Ya incluido en Svelte 4 |

🔗 **Existing Code to Reuse:**
- `src/lib/stores/` — patrón de stores existente en el proyecto
- `src/lib/components/modules/statics/ai/Index.svelte` — lógica actual a migrar

---

## Recommendation

**Option A** es la opción recomendada porque:

El problema es un **contrato roto entre API y frontend** — el fix correcto es el más pequeño posible que resuelve exactamente ese desajuste. Cambiar 2 líneas en `fetchBots()` es quirúrgico, reversible, y no introduce riesgo en el resto del sistema (chat, historial IndexedDB, filtrado de permisos).

La Opción B y C agregan valor arquitectónico pero son prematuras: este es un bug fix, no una refactorización. Según el principio de mínima superficie de cambio, no se debe refactorizar código funcional como parte de una corrección de bug.

El patrón `response?.agents ?? response ?? []` es además **backward compatible**: si el backend revierte el cambio o si hay otros endpoints con distinto formato, el componente sigue funcionando sin cambios adicionales.

---

## Feature Description

### User-Facing Behavior

- Al navegar al módulo AI con `chatBot` habilitado, la vista `BotSelectionView` muestra la lista completa de bots disponibles (filtrada por programa del usuario)
- Los bots aparecen con su nombre, descripción y estado (enabled/disabled)
- El filtrado por búsqueda funciona normalmente
- Los superusers ven todos los bots; usuarios normales solo ven los de su programa

### Internal Behavior

1. `onMount` llama `fetchBots()`
2. `fetchBots()` hace `GET /api/v1/bots` via `getData()`
3. La respuesta se normaliza: si tiene clave `agents`, se extrae ese array; si ya es un array, se usa directamente; si es null/undefined, se usa `[]`
4. El array normalizado se filtra por `permissions.programs` según el programa del usuario actual (lógica existente sin cambios)
5. `botList` se asigna con el resultado filtrado
6. `resolvePendingFromURL()` se llama para resolver selecciones pendientes desde la URL

### Edge Cases & Error Handling

- **API retorna objeto vacío `{}`**: `response?.agents ?? response ?? []` resulta en `{}` → el `.filter()` fallaría. Agregar un guard: `Array.isArray(bots) ? bots.filter(...) : []`
- **API retorna `null`**: el `?? []` lo convierte en array vacío — sin crash
- **API retorna array directo** (formato anterior): `response?.agents` es `undefined`, el `?? response` lo usa directamente — backward compatible
- **Error de red / 401**: el `catch` existente con `handleAuthError` ya maneja esto correctamente — sin cambios

---

## Capabilities

### New Capabilities
- `bot-listing-api-normalization`: Normalización defensiva de la respuesta del endpoint de bots, compatible con múltiples formatos de respuesta (`{ agents: [] }` o array directo)

### Modified Capabilities
- `bot-listing-fetch`: La función `fetchBots()` en `Index.svelte` se modifica para extraer el array desde `response.agents` si existe

---

## Impact & Integration

| Affected Component | Impact Type | Notes |
|---|---|---|
| `src/lib/components/modules/statics/ai/Index.svelte` | modifies | Solo función `fetchBots()`, líneas 253-309 |
| `src/lib/components/modules/statics/ai/BotSelectionView.svelte` | depends on | Recibe `botList` via prop — sin cambios |
| `src/lib/components/modules/statics/ai/ManageBotsView.svelte` | depends on | Recibe `botList` via prop — sin cambios |
| `src/lib/services/getData.ts` | no change | Se usa igual |

---

## Open Questions

- [ ] ¿El endpoint `/api/v1/bots` es el único afectado o también `/api/v1/agents`? — *Owner: Backend team*
- [ ] ¿Habrá más cambios de contrato en la API de AI próximamente? Si sí, considerar Opción B como tech debt — *Owner: Tech Lead*
- [ ] ¿El campo `enabled: false` en un bot debería ocultarlo del listado? Actualmente no se filtra por `enabled` — *Owner: Product*
