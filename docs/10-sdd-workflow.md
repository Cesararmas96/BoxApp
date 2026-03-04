# Guía SDD — Spec-Driven Development

> **¿Qué es SDD?** Una metodología donde las **especificaciones son la única fuente de verdad**. Los agentes consumen documentos de spec y producen Task Artifacts — archivos discretos y autocontenidos que cualquier agente puede ejecutar de forma independiente o en paralelo.

---

## Ciclo de vida completo

```
                         ┌─ /sdd-brainstorm → explorar opciones ──────┐
                         │                                               │
                         ├─ /sdd-proposal  → discutir la idea ──────────┤
                         │                                               ↓
[Humano] ───────────────┤                                         Spec aprobada
                         │                                               │
                         └──────── /sdd-spec → crear spec ──────────────┘
                                                                         │
                                                                    /sdd-task
                                                                         │
                                                                  Tasks en active/
                                                                         │
                                                      /sdd-start TASK-XXX → implementación
                                                                         │
                                                                  tasks/completed/
                                                                         │
                                                           /sdd-codereview TASK-XXX
```

---

## Comandos disponibles

| Comando | Cuándo usarlo |
|---------|---------------|
| `/sdd-brainstorm` | Idea sin definir — explorar opciones técnicas antes de especificar |
| `/sdd-proposal` | Idea en lenguaje no técnico — discutir antes de especificar |
| `/sdd-spec` | Ya sabes qué quieres construir — generar el documento de spec |
| `/sdd-task` | Spec aprobada — descomponer en tareas ejecutables |
| `/sdd-status` | Ver estado del tablero de tareas |
| `/sdd-next` | Ver qué tareas están listas para asignar |
| `/sdd-start` | Tomar una tarea y ejecutarla |
| `/sdd-codereview` | Revisar código de una tarea completada |

---

## Estructura de carpetas

```
sdd/
├── WORKFLOW.md               — Metodología completa (fuente de verdad del sistema)
├── proposals/
│   └── <feature>.brainstorm.md   — Exploración de opciones
│   └── <feature>.proposal.md     — Propuesta en lenguaje no técnico
├── specs/
│   └── <feature>.spec.md         — Especificación aprobada (SSOT)
├── tasks/
│   ├── .index.json               — Índice de todas las tareas
│   ├── active/
│   │   └── TASK-NNN-<slug>.md    — Tareas pendientes/en progreso
│   └── completed/
│       └── TASK-NNN-<slug>.md    — Tareas terminadas
└── templates/
    ├── brainstorm.md
    ├── proposal.md
    ├── spec.md
    └── task.md
```

---

## Referencia de comandos

### `/sdd-brainstorm [topic] [-- notas]`

Explora una idea generando al menos **3 enfoques distintos** con sus pros/contras, librerías relevantes y código existente a reutilizar. Termina con una recomendación razonada.

**Salida:** `sdd/proposals/<topic>.brainstorm.md`

**Flujo típico:**
```
/sdd-brainstorm auth-refresh -- el token expira y el usuario pierde datos
```

---

### `/sdd-proposal [título] [-- notas]`

Discute la funcionalidad en lenguaje no técnico. El agente hace preguntas sobre motivación, alcance e impacto. Opcionalmente genera una spec al finalizar.

**Salida:** `sdd/proposals/<título>.proposal.md`

**Flujo típico:**
```
/sdd-proposal nueva galería de imágenes -- quiero que los usuarios puedan subir fotos desde mobile
```

---

### `/sdd-spec [feature-name] [-- notas]`

Crea la **especificación formal** de la funcionalidad. Si existe un `.brainstorm.md` o `.proposal.md` previo, lo usa para pre-llenar la spec.

**La spec debe estar en `status: approved` antes de generar tareas.**

**Salida:** `sdd/specs/<feature-name>.spec.md`

**Flujo típico:**
```
/sdd-spec auth-refresh
# → Revisa spec → cambia status a approved → /sdd-task
```

---

### `/sdd-task sdd/specs/<feature>.spec.md`

Lee una spec aprobada y la descompone en **Task Artifacts** atómicos. Cada tarea incluye:
- Scope exacto
- Archivos a crear/modificar
- Notas de implementación
- Criterios de aceptación con tests

También crea/actualiza `sdd/tasks/.index.json`.

**Ejemplo de árbol de dependencias generado:**
```
TASK-001 (interfaz base)
    ├── TASK-002 (implementación A)   ← paralela con 003
    ├── TASK-003 (implementación B)   ← paralela con 002
    └── TASK-004 (integración)        ← espera 002 + 003
```

---

### `/sdd-status`

Muestra el tablero completo de tareas con estados visuales:

```
📊 SDD Status — <feature>

  ID        Priority  Effort  Status        Asignado       Título
  ─────────────────────────────────────────────────────────────────
  TASK-001  high      S       ✅ done       session-abc    Setup estructura
  TASK-002  high      M       🔄 progress   session-def    Interfaz base
  TASK-003  high      L       ⏳ pending    —              Integración PgVector
  TASK-004  high      L       🔒 blocked    —              Integración ArangoDB

Progreso: 1/4 done (25%)
Sin bloqueo y sin asignar: TASK-003
```

---

### `/sdd-next`

Filtra las tareas **sin bloqueo y sin asignar**, ordenadas por prioridad. Indica cuáles pueden ejecutarse en paralelo.

---

### `/sdd-start TASK-NNN`

Toma una tarea y la ejecuta completamente:

1. Valida que no esté bloqueada por dependencias pendientes
2. Marca la tarea como `in-progress` en el índice
3. Lee el archivo de tarea y la spec referenciada
4. **Implementa el código** (crea/modifica los archivos del scope)
5. Corre linting y tests de aceptación
6. Mueve el archivo a `sdd/tasks/completed/`
7. Actualiza el índice a `done`
8. Completa la sección "Completion Note"

> El agente NO debe detenerse hasta que la tarea esté completamente terminada, salvo que encuentre una dependencia rota, una spec ambigua o tests que no pueda resolver.

---

### `/sdd-codereview TASK-NNN`

Analiza el código producido por una tarea completada contra 8 dimensiones:

| # | Dimensión | Qué evalúa |
|---|-----------|-----------|
| 1 | Correctness | Bugs, edge cases, tipado |
| 2 | Security | Inyección, XSS, secretos, exposición de datos |
| 3 | Performance | N+1 queries, loops, cacheo, complejidad |
| 4 | Code Quality | DRY, naming, legibilidad |
| 5 | Architecture | SOLID, patrones, modularidad |
| 6 | Testing | Cobertura, aserciones significativas |
| 7 | Documentation | Docstrings, API pública documentada |
| 8 | Logic & Hallucinations | Cadena lógica verificable, APIs reales |

Cada hallazgo tiene severidad: 🔴 Critical / 🟠 Important / 🟡 Suggestion / 💡 Nitpick

**Guardar reporte opcionalmente en:** `docs/reviews/TASK-NNN-review.md`

---

## Formato del Task Artifact

```markdown
# TASK-NNN: <Título>

**Feature**: <nombre del feature>
**Spec**: sdd/specs/<feature>.spec.md
**Status**: [ ] pending
**Priority**: high | medium | low
**Effort**: S (<2h) | M (2-4h) | L (4-8h) | XL (>8h)
**Depends-on**: TASK-X, TASK-Y  (o "none")
**Assigned-to**: (session ID o "unassigned")

## Context
Por qué existe esta tarea y cómo encaja en el feature.

## Scope
Qué debe implementar exactamente esta tarea.

## NOT in scope
Qué pertenece a otras tareas.

## Files to Create/Modify
- `src/path/to/file.ts` — descripción
- `tests/path/to/test.ts` — tests unitarios

## Implementation Notes
Guía técnica: patrones a seguir, código existente a referenciar, restricciones.

## Acceptance Criteria
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Tests pasan: `npm run test`

## Completion Note
(El agente llena esto al terminar)
```

---

## Esquema del índice `.index.json`

```json
{
  "feature": "nombre-feature",
  "spec": "sdd/specs/nombre-feature.spec.md",
  "created_at": "2026-03-03T00:00:00Z",
  "tasks": [
    {
      "id": "TASK-001",
      "slug": "setup-estructura",
      "title": "Setup estructura del módulo",
      "status": "done",
      "priority": "high",
      "effort": "S",
      "depends_on": [],
      "assigned_to": null,
      "file": "sdd/tasks/completed/TASK-001-setup-estructura.md"
    },
    {
      "id": "TASK-002",
      "slug": "interfaz-base",
      "title": "Implementar interfaz base",
      "status": "pending",
      "priority": "high",
      "effort": "M",
      "depends_on": ["TASK-001"],
      "assigned_to": null,
      "file": "sdd/tasks/active/TASK-002-interfaz-base.md"
    }
  ]
}
```

---

## Reglas de paralelismo

Los agentes pueden trabajar en paralelo cuando las tareas no comparten dependencias:

```
TASK-001 (base interface)
    ├── TASK-002  ← puede correr en paralelo con TASK-003
    ├── TASK-003  ← puede correr en paralelo con TASK-002
    └── TASK-004  ← espera a TASK-002 y TASK-003
```

**Un agente nunca debe iniciar una tarea si sus `depends_on` no están en `done`.**

---

## Reglas de calidad para agentes

1. **No modificar archivos fuera del scope** — respetar límites de la tarea
2. **Seguir patrones existentes** — referenciar código mencionado en la tarea
3. **Tests primero** — enfoque TDD por tarea cuando aplique
4. **Actualizar el índice** — siempre actualizar `.index.json` al completar
5. **Commits atómicos** — una tarea = un commit lógico
6. **Ambigüedad → nota** — si algo no está claro, registrarlo en el Completion Note

---

## Ejemplo de flujo completo

```bash
# 1. Explorar opciones (si la idea es nueva o compleja)
/sdd-brainstorm paginacion-infinita -- la tabla de rutas tarda en cargar

# 2. Crear spec formal
/sdd-spec paginacion-infinita

# 3. Aprobar spec (editar el archivo y cambiar status: draft → approved)

# 4. Generar tareas
/sdd-task sdd/specs/paginacion-infinita.spec.md

# 5. Ver estado
/sdd-status

# 6. Ver qué está listo
/sdd-next

# 7. Ejecutar una tarea
/sdd-start TASK-001

# 8. Revisar el código producido
/sdd-codereview TASK-001
```
