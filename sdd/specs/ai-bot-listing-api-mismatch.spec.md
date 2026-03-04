# Feature Specification: AI Bot Listing — API Response Normalization

**Feature ID**: FEAT-002
**Date**: 2026-03-03
**Author**: Claude Code
**Status**: draft
**Target version**: current

---

## 1. Motivation & Business Requirements

### Problem Statement

El componente principal del módulo AI (`src/lib/components/modules/statics/ai/Index.svelte`)
no muestra el listado de bots disponibles. La causa raíz es un **breaking change** no comunicado
en el contrato del endpoint `GET /api/v1/bots`: el backend cambió la estructura de respuesta
de un array directo a un objeto con clave `"agents"`.

```
ANTES:  [ { chatbot_id: "...", name: "...", ... }, ... ]
AHORA:  { "agents": [ { chatbot_id: "...", name: "...", ... }, ... ] }
```

La función `fetchBots()` llama a `response.filter(...)`, que lanza un error silencioso cuando
`response` es un objeto (no un array). `botList` queda vacío y el usuario ve la pantalla vacía
sin ningún mensaje de error que le indique qué ocurrió.

### Goals

- Restaurar el listado de bots en el módulo AI para todos los usuarios afectados
- Hacer la normalización defensiva y backward compatible (si el API revierte al formato array, no se rompe)
- Introducir un guard explícito contra respuestas inesperadas (null, objeto vacío, array vacío)
- Cambio mínimo y atómico — sin refactorizar lógica no relacionada

### Non-Goals (explicitly out of scope)

- No refactorizar la arquitectura de carga de bots (no crear servicios ni stores nuevos)
- No modificar `ManageBotsView`, `BotSelectionView`, `ChatView` ni ningún otro componente hijo
- No agregar filtrado por `bot.enabled` (requiere decisión de producto — ver Open Questions)
- No cambiar el flujo de `fetchAgents()` (carga desde localStorage, no afectado)
- No modificar la UI ni los estilos

---

## 2. Architectural Design

### Overview

La corrección se aplica exclusivamente en la función `fetchBots()` dentro de `Index.svelte`.
Se introduce una línea de normalización que extrae el array de bots de cualquier formato de
respuesta que el API pueda devolver:

```
GET /api/v1/bots
      │
      ▼
  getData()          ← sin cambios
      │
      ▼
 normalize()         ← NUEVO: extrae response.agents ?? response ?? []
      │
      ▼
 Array.isArray()     ← NUEVO: guard contra objeto vacío / null
      │
      ▼
 .filter(perms)      ← sin cambios (lógica de permisos intacta)
      │
      ▼
  botList = [...]    ← resultado filtrado por programa del usuario
```

### Component Diagram

```
Index.svelte
  └── fetchBots()
        ├── getData(`${botsApi}/bots`)     [sin cambios]
        ├── normalize(response)             [NUEVO - inline]
        │     ├── if response.agents → response.agents
        │     ├── elif Array.isArray(response) → response
        │     └── else → []
        ├── Array.isArray guard             [NUEVO]
        ├── .filter(permissions)            [sin cambios]
        └── botList = filtered             [sin cambios]
```

### Integration Points

| Existing Component | Integration Type | Notes |
|---|---|---|
| `src/lib/components/modules/statics/ai/Index.svelte` | modifies | Solo `fetchBots()`, líneas 253-309 |
| `src/lib/components/modules/statics/ai/BotSelectionView.svelte` | depends on (no change) | Recibe `botList` via prop |
| `src/lib/components/modules/statics/ai/ManageBotsView.svelte` | depends on (no change) | Recibe `botList` via prop |
| `src/lib/services/getData.ts` | uses (no change) | Función de fetch con auth |
| `GET /api/v1/bots` | consumes | Endpoint cuyo contrato cambió |

### Data Models

El tipo de cada elemento del array (bot) ya está correctamente definido en el componente.
La normalización no cambia la forma de cada objeto bot — solo corrige dónde se encuentra
el array en la respuesta.

```ts
// Estructura de respuesta actual del API (nueva)
interface BotsApiResponse {
  agents: Bot[]
}

// Estructura de cada bot (sin cambios — ya correcta en el código)
interface Bot {
  chatbot_id: string      // UUID — identificador único
  name: string
  description: string
  enabled: boolean
  permissions: {
    users: string | string[]
    groups: string | string[]
    programs: string | string[]
    job_codes: string | string[]
    organizations: string | string[]
  }
  model_name: string
  llm: string
  // ... resto de campos
}
```

### New Public Interfaces

No se exponen nuevas interfaces públicas. La normalización es interna a `fetchBots()`.

---

## 3. Module Breakdown

### Module 1: fetchBots() — Response Normalization

- **Path**: `src/lib/components/modules/statics/ai/Index.svelte` (función `fetchBots`, líneas ~253-309)
- **Responsibility**: Adaptar la respuesta del endpoint para que el pipeline de filtrado existente reciba siempre un array, independientemente del formato de respuesta
- **Depends on**: `getData` de `src/lib/services/getData.ts` (sin cambios)

**Lógica de normalización a implementar:**

```ts
// Dentro de fetchBots(), reemplazar la línea:
//   botList = response.filter(...)
// por:

const rawBots = Array.isArray(response?.agents)
  ? response.agents
  : Array.isArray(response)
    ? response
    : []

botList = rawBots.filter((bot) => {
  // ... lógica de permisos existente — sin cambios
})
```

---

## 4. Test Specification

### Casos de prueba manuales (smoke test)

| Caso | Input API | Resultado esperado |
|---|---|---|
| Formato nuevo | `{ "agents": [...bots] }` | `botList` contiene los bots filtrados por programa |
| Formato antiguo | `[...bots]` (array directo) | `botList` contiene los bots filtrados por programa |
| Respuesta vacía | `{ "agents": [] }` | `botList = []`, pantalla vacía sin error |
| null | `null` | `botList = []`, sin crash |
| Objeto vacío | `{}` | `botList = []`, sin crash |
| Error 401 | Network error | `handleAuthError` redirige a `/login` |
| Sin permisos | Bots sin `permissions.programs` del usuario | `botList = []` (filtrado existente) |

### Unit Tests (si se agrega test suite)

| Test | Descripción |
|---|---|
| `normalizes_agents_key_response` | `{ agents: [bot1] }` → `[bot1]` |
| `normalizes_array_response` | `[bot1]` → `[bot1]` (backward compat) |
| `normalizes_null_response` | `null` → `[]` |
| `normalizes_empty_object` | `{}` → `[]` |
| `filters_by_program` | Solo bots con `permissions.programs` del usuario |
| `superuser_sees_all` | Superuser recibe todos los bots sin filtro |

---

## 5. Acceptance Criteria

> Esta feature está completa cuando TODOS los siguientes criterios son verdaderos:

- [ ] El listado de bots se muestra correctamente en el módulo AI cuando la API devuelve `{ "agents": [...] }`
- [ ] Los bots se filtran correctamente por `permissions.programs` del programa del usuario actual
- [ ] Los superusers ven todos los bots sin filtrado
- [ ] El componente no lanza errores en consola cuando la API devuelve null, objeto vacío, o array vacío
- [ ] El formato antiguo de respuesta (array directo) sigue funcionando sin errores
- [ ] El flujo de chat existente (seleccionar bot → chatear → historial) no presenta regresiones
- [ ] Solo se modifican las líneas 253-309 de `Index.svelte` (función `fetchBots`)
- [ ] No se introducen nuevas dependencias

---

## 6. Implementation Notes & Constraints

### Patterns to Follow

- **Svelte 4** — no usar Runes (`$state`, `$derived`). Usar variables reactivas (`let`) y asignaciones directas
- **Defensive normalization**: usar `Array.isArray()` como guard — no asumir que `?.agents` es un array
- **Inline fix**: la normalización va dentro de `fetchBots()`, no en una función helper separada (YAGNI)
- **No silent failures**: si `rawBots` queda vacío por razón inesperada, el filtro devuelve `[]` sin crash

### Known Risks / Gotchas

- **El endpoint también podría tener paginación en el futuro**: si `{ agents: [], total: N, page: 1 }` aparece, el fix actual lo maneja correctamente (ya extrae `agents`)
- **`response?.agents` podría ser un objeto**, no un array, si el API cambia de nuevo. El guard `Array.isArray()` previene esto
- **`resolvePendingFromURL()` se llama al final de `fetchBots()`** — no hay que modificar ese llamado, funciona una vez `botList` está asignado correctamente

### External Dependencies

| Package | Version | Reason |
|---|---|---|
| — | — | Sin nuevas dependencias |

---

## 7. Open Questions

- [ ] ¿El endpoint `/api/v1/agents` (para agents, no bots) también cambió su estructura de respuesta? — *Owner: Backend team*
- [ ] ¿Habrá más cambios de contrato en la API de AI próximamente? Si la respuesta es sí, considerar crear un adapter service como tech debt planificado — *Owner: Tech Lead*
- [ ] ¿Los bots con `enabled: false` deben ocultarse del listado de selección? Actualmente no se filtra por este campo — *Owner: Product*
- [ ] ¿Se debe mostrar un mensaje al usuario cuando `botList` queda vacío (e.g., "No bots available for your program")? Actualmente la pantalla queda en blanco — *Owner: UX/Product*

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-03-03 | Claude Code | Initial draft — basado en brainstorm `ai-bot-listing-api-mismatch.brainstorm.md` |
