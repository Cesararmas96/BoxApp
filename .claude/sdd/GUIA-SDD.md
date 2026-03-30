# Guía SDD para Juniors — Cómo trabajar con el flujo Spec-Driven Development

> Esta guía cubre todos los casos de uso del flujo SDD con ejemplos reales y fáciles de entender.

---

## ¿Qué es SDD y por qué usarlo?

SDD (**Spec-Driven Development**) es un flujo de trabajo donde **primero escribes QUÉ vas a construir** (el spec), y luego Claude lo descompone en tareas pequeñas y las implementa una por una.

La idea clave es simple:

```
Idea → Spec (documento) → Tareas → Código → Review
```

Esto evita que Claude (o tú) se quede dando vueltas sin saber qué hacer, porque todo está documentado antes de tocar código.

---

## Comandos disponibles — Referencia rápida

| Comando | ¿Para qué sirve? | ¿Cuándo usarlo? |
|---|---|---|
| `/sdd-proposal` | Proponer una idea en lenguaje simple | Cuando tienes una idea vaga |
| `/sdd-brainstorm` | Explorar opciones técnicas | Cuando no sabes cómo implementarlo |
| `/sdd-fromjira` | Importar un ticket de Jira | Cuando el requerimiento viene de Jira |
| `/sdd-spec` | Crear el documento de especificación | Cuando sabes qué quieres construir |
| `/sdd-task` | Descomponer el spec en tareas | Después de aprobar el spec |
| `/sdd-status` | Ver el estado de todas las tareas | Para saber qué hay pendiente |
| `/sdd-next` | Ver qué tarea puedo empezar ahora | Para saber qué hacer a continuación |
| `/sdd-start` | Empezar a implementar una tarea | Para ejecutar una tarea específica |
| `/sdd-fix` | Registrar y reparar un bug en una tarea existente | Cuando aparece un bug en una tarea `done` o `in-progress` |
| `/sdd-codereview` | Revisar el código de una tarea completada | Después de que una tarea está done |

---

## Flujo general — El mapa completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  PUNTO DE ENTRADA (elige uno según tu situación):                   │
│                                                                     │
│  A) Idea vaga       → /sdd-proposal  ──────────────────────┐       │
│  B) Idea técnica    → /sdd-brainstorm ─────────────────────┤       │
│  C) Ticket de Jira  → /sdd-fromjira ──────────────────────┤       │
│  D) Idea clara      → /sdd-spec (directo) ─────────────────┘       │
│                              │                                      │
│                              ↓                                      │
│                        /sdd-spec                                    │
│                   (Documento de spec)                               │
│                              │                                      │
│                              ↓                                      │
│                        /sdd-task                                    │
│                    (Genera las tareas)                              │
│                              │                                      │
│              ┌───────────────┴────────────────┐                     │
│              ↓                                ↓                     │
│         /sdd-status                      /sdd-next                  │
│       (ver el board)              (qué puedo empezar)               │
│                              │                                      │
│                              ↓                                      │
│                        /sdd-start TASK-NNN                          │
│                       (implementar tarea)                           │
│                              │                                      │
│                              ↓                                      │
│                      /sdd-codereview TASK-NNN                       │
│                        (revisar el código)                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Brainstorm vs Proposal — ¿Cuál va primero?

La diferencia está en el **punto de partida mental**:

### `/sdd-proposal` — Partes de una IDEA

Piensas en términos de **negocio / usuario**, no de código.

> "Quiero que los usuarios puedan exportar sus datos"

Claude te hace preguntas para aterrizar la idea:
- ¿Qué problema resuelve?
- ¿A quién afecta?
- ¿Qué está fuera de scope?

El output es un **documento de propuesta** (`*.proposal.md`) — sin código, sin opciones técnicas, solo la idea aterrizada. Después puedes pasar al spec o al brainstorm.

### `/sdd-brainstorm` — Partes de un PROBLEMA TÉCNICO

Piensas en términos de **implementación**, y quieres explorar opciones antes de comprometerte.

> "Necesito notificaciones en tiempo real, ¿WebSockets, SSE o polling?"

Claude investiga el codebase y genera **3+ opciones técnicas** con pros/cons, librerías, esfuerzo estimado y recomienda una.

El output es un **documento de exploración** (`*.brainstorm.md`) — sin código aún, pero con decisiones técnicas ya tomadas.

### ¿Cuándo usar cada uno?

```
Idea vaga (no técnica)
    → /sdd-proposal → entiendes QUÉ construir
        → /sdd-brainstorm → decides CÓMO construirlo  ← opcional
            → /sdd-spec

Problema técnico claro
    → /sdd-brainstorm → decides CÓMO construirlo
        → /sdd-spec
```

**Regla simple:**
- No tienes claro **qué** construir → `proposal` primero
- Tienes claro **qué** pero no **cómo** → `brainstorm` primero
- Tienes claro ambos → directo a `spec`

---

## Casos de uso con ejemplos

---

### CASO 1 — "Tengo una idea pero no sé cómo explicarla técnicamente"

**Usa: `/sdd-proposal`**

Este comando te permite describir la idea en lenguaje simple. Claude te hace preguntas para entender mejor y luego genera un spec automáticamente.

**Ejemplo:**

```
/sdd-proposal dark-mode -- quiero que la app tenga modo oscuro
```

Claude te preguntará:
- ¿Qué problema resuelve?
- ¿Qué páginas o componentes afecta?
- ¿Hay algo que NO debe cambiar?

Cuando termines, Claude genera:
```
✅ Proposal guardada: sdd/proposals/dark-mode.proposal.md
¿Quieres que genere el spec formal ahora?
```

Luego puedes decir "sí" y salta automáticamente al spec.

---

### CASO 2 — "Tengo una idea técnica pero quiero ver opciones antes de decidir"

**Usa: `/sdd-brainstorm`**

Este comando explora al menos 3 formas distintas de implementar algo, con pros/cons y estimaciones de esfuerzo. Perfecto cuando no estás seguro de qué librería usar o qué patrón seguir.

**Ejemplo:**

```
/sdd-brainstorm real-time-notifications -- necesito notificaciones en tiempo real para el usuario
```

Claude genera un documento con opciones como:
- Opción A: WebSockets con socket.io
- Opción B: Server-Sent Events (SSE)
- Opción C: Polling cada 30 segundos

Cada opción incluye pros, contras, esfuerzo estimado y librerías recomendadas.

Al final, Claude recomienda una opción y puedes continuar con:
```
/sdd-spec real-time-notifications
```

---

### CASO 3 — "El requerimiento viene de un ticket de Jira"

**Usa: `/sdd-fromjira`**

> Requiere tener `mcp-atlassian` configurado.

Claude lee el ticket de Jira directamente y genera el brainstorm automáticamente.

**Ejemplo:**

```
/sdd-fromjira NAV-7724
```

Claude extrae el título, descripción y contexto del ticket, genera 3 opciones técnicas y guarda el brainstorm en `sdd/proposals/NAV-7724-<slug>.brainstorm.md`.

Siguiente paso:
```
/sdd-spec NAV-7724-export-csv
```

---

### CASO 4 — "Sé exactamente qué quiero construir"

**Usa: `/sdd-spec`** (punto de entrada directo)

Cuando ya tienes claridad, vas directo al spec sin pasar por proposal ni brainstorm.

**Ejemplo:**

```
/sdd-spec export-csv -- el usuario debe poder exportar la tabla de resultados en formato CSV
```

Claude crea `sdd/specs/export-csv.spec.md` con:
- Motivación y contexto
- Diseño arquitectónico
- Componentes involucrados
- Criterios de aceptación
- Preguntas abiertas

Revisa el spec y cuando esté listo:
```
/sdd-task sdd/specs/export-csv.spec.md
```

---

### CASO 5 — "Quiero reparar un bug"

**Usa: `/sdd-fix`**

Este comando maneja los 3 escenarios posibles de bug automáticamente.

#### Escenario A — La tarea está `in-progress`

El bug apareció mientras la tarea aún estaba en curso. Claude lo arregla dentro de la misma tarea sin crear una nueva.

```
/sdd-fix TASK-003 -- el store no está exportando el tipo correcto
```

Salida:
```
🔧 Fixing bug within in-progress TASK-003 (no new task needed)
```

#### Escenario B — La tarea está `done`, bug aislado

La tarea se cerró pero el bug apareció después. Claude crea una nueva tarea de fix enlazada a la original.

```
/sdd-fix TASK-003 -- los componentes que consumen el store migrado rompen porque la sintaxis cambió de $store a store.subscribe()
```

Claude:
1. Diagnostica la causa raíz
2. Crea `TASK-004-fix-store-syntax.md` con `depends-on: TASK-003`
3. Actualiza el índice
4. Implementa el fix inmediatamente

#### Escenario C — La tarea está `done` y el bug bloquea otras tareas

Igual que el Escenario B, pero al terminar Claude te avisa qué tareas quedaron desbloqueadas:

```
/sdd-fix TASK-003 -- el store migrado causa que TASK-005 y TASK-006 fallen al importar
```

Salida al terminar:
```
✅ Fix complete: TASK-004 — fix store syntax

Next:
  - /sdd-next  → TASK-005 y TASK-006 ahora están desbloqueadas
```

#### Flujo completo de ejemplo (migración con bug)

```
/sdd-status                          ← ver qué está roto
/sdd-fix TASK-003 -- <descripción>   ← diagnostica, crea task, implementa
/sdd-next                            ← ver qué se desbloqueó
/sdd-start TASK-005                  ← continuar con la migración
```

**Commit generado automáticamente:**
```
fix: resolve store syntax incompatibility after SvelteKit v2 migration (closes TASK-004)
```

---

### CASO 6 — "Quiero ver qué tareas hay pendientes"

**Usa: `/sdd-status`**

```
/sdd-status
```

Muestra el tablero completo:

```
📊 SDD Status — export-csv

  ID        Priority  Effort  Status       Title
  ─────────────────────────────────────────────────────────
  TASK-001  high      S       ✅ done      Crear utilidad de serialización CSV
  TASK-002  high      M       🔄 progress  Botón de exportar en la tabla
  TASK-003  medium    M       🔒 blocked   Tests E2E del flujo completo
  TASK-004  low       S       ⏳ pending   Tooltip de ayuda en el botón

Progress: 1/4 done (25%)
Listas para empezar: TASK-004
```

---

### CASO 7 — "No sé qué tarea debo empezar ahora"

**Usa: `/sdd-next`**

```
/sdd-next
```

Claude lee el índice, filtra las tareas que no tienen dependencias pendientes y te muestra solo las que puedes empezar ahora:

```
🚀 Tareas desbloqueadas listas para asignar:

  TASK-002  [high/M]  Botón de exportar en la tabla
  TASK-004  [low/S]   Tooltip de ayuda

Pueden correr en paralelo. Para empezar:
  /sdd-start TASK-002
```

---

### CASO 8 — "Quiero empezar a implementar una tarea"

**Usa: `/sdd-start TASK-NNN`**

```
/sdd-start TASK-002
```

Claude:
1. Verifica que la tarea esté desbloqueada (sus dependencias deben estar `done`)
2. La marca como `in-progress`
3. Lee el spec y el task file
4. Muestra un resumen de qué va a hacer
5. **Implementa el código automáticamente** sin esperar

```
🚀 Starting TASK-002: Botón de exportar en la tabla
   Feature: export-csv  |  Priority: high  |  Effort: M

📋 Scope:
   - Agregar botón "Exportar CSV" sobre la tabla de resultados
   - Al hacer click, llama a la utilidad de serialización de TASK-001

📂 Files:
   - src/lib/components/ResultsTable.svelte (MODIFY)

✅ Acceptance Criteria:
   - El botón aparece solo si hay al menos 1 resultado
   - El archivo descargado tiene el nombre correcto
```

Claude **no se detiene** — implementa todo y solo te pide ayuda si hay ambigüedad o un test que no puede resolver.

Al terminar, mueve la tarea a `sdd/tasks/completed/` y actualiza el índice.

---

### CASO 9 — "Quiero revisar el código de una tarea completada"

**Usa: `/sdd-codereview TASK-NNN`**

```
/sdd-codereview TASK-002
```

Claude hace una revisión estructurada del código implementado, evaluando:

| Dimensión | Qué revisa |
|---|---|
| Correctness | Lógica, edge cases, manejo de errores |
| Security | XSS, inputs sin validar, datos expuestos |
| Performance | Re-renders innecesarios, queries redundantes |
| Code Quality | DRY, naming, legibilidad |
| Architecture | Patrones Svelte 5, SvelteKit conventions |
| Testing | Cobertura, assertions significativas |

Cada issue tiene severidad:
- 🔴 **Critical** — debe arreglarse antes de producción
- 🟠 **Important** — afecta mantenibilidad
- 🟡 **Suggestion** — mejora opcional
- 💡 **Nitpick** — preferencia de estilo

Al final genera un scorecard con rating por dimensión.

---

## Dónde viven los archivos

```
sdd/
├── proposals/          ← brainstorms y proposals (ideas en exploración)
│   └── dark-mode.brainstorm.md
│   └── export-csv.proposal.md
├── specs/              ← especificaciones aprobadas (SSOT)
│   └── export-csv.spec.md
├── tasks/
│   ├── .index.json     ← índice de todas las tareas (no editar a mano)
│   ├── active/         ← tareas en progreso o pendientes
│   │   └── TASK-002-export-button.md
│   └── completed/      ← tareas terminadas
│       └── TASK-001-csv-serializer.md
├── reviews/            ← reportes de code review (opcional)
│   └── TASK-002-review.md
├── templates/          ← plantillas base (no editar)
└── WORKFLOW.md         ← documentación del flujo completo
```

---

## Reglas de oro para juniors

1. **No empieces a codear sin un task** — si no hay task, créalo primero.
2. **No modifiques archivos fuera del scope del task** — respeta los límites.
3. **El spec es la fuente de verdad** — si algo no está claro, actualiza el spec, no el código.
4. **Un task = un commit** — commits pequeños y atómicos.
5. **Si una tarea está bloqueada, no la fuerces** — resuelve primero las dependencias.
6. **Cualquier "fix rápido" que no es óptimo debe llevar un `TODO: (Agent)`** comentario explicando la deuda técnica.

---

## Resumen del flujo según tu situación

| Situación | Flujo recomendado |
|---|---|
| Idea vaga | `proposal` → `spec` → `task` → `start` |
| Idea técnica sin decidir enfoque | `brainstorm` → `spec` → `task` → `start` |
| Ticket de Jira | `fromjira` → `spec` → `task` → `start` |
| Feature clara | `spec` → `task` → `start` |
| Bug en tarea `in-progress` | `/sdd-fix TASK-NNN` (arregla en la misma tarea) |
| Bug en tarea `done` | `/sdd-fix TASK-NNN` (crea task de fix + implementa) |
| Bug complejo (causa desconocida) | `brainstorm` → `/sdd-fix TASK-NNN` |
| Ver progreso | `status` |
| Saber qué empezar | `next` → `start` |
| Revisar código terminado | `codereview` |
