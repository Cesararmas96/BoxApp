# TASK-028: Documentar y validar proceso de migraciones para producción

**Feature**: Despliegue a Vercel (FEAT-006)
**Spec**: `sdd/specs/despliegue-vercel.spec.md`
**Status**: pending
**Priority**: medium
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-025
**Assigned-to**: unassigned

---

## Context

Las migraciones de BD no corren automáticamente en Vercel (el script `predev` solo aplica
en `npm run dev` local). Sin un proceso documentado, existe riesgo de desplegar código que
asume schema nuevo mientras la BD de producción tiene schema viejo.
Implementa el **Módulo 4** del spec FEAT-006.

---

## Scope

- Crear `docs/deployment/migrations.md` con el proceso manual de migraciones para producción.
- Verificar que el comando `supabase db push` funciona contra el proyecto de producción.
- Agregar un bloque de advertencia en `README.md` o `CONTRIBUTING.md` para que otros devs
  no hagan merge a `main` sin correr migraciones primero.
- Documentar cómo linkear el CLI de Supabase al proyecto de producción.

**NOT in scope**: automatizar migraciones en CI/CD (open question del spec),
cambios en el código de la app.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `docs/deployment/migrations.md` | CREATE | Guía paso a paso del proceso de migraciones |
| `README.md` | MODIFY | Agregar sección "Deploy" con link a la guía |

---

## Implementation Notes

### Contenido de `docs/deployment/migrations.md`

El documento debe cubrir:

```markdown
# Migraciones de Base de Datos — Producción

## Pre-requisitos
- Supabase CLI instalado (`npm install -g supabase`)
- Acceso al proyecto Supabase de producción
- `SUPABASE_PROJECT_REF` del proyecto (ver Supabase Dashboard → Settings → General)

## Proceso antes de cada deploy a main

1. Asegurarse de estar en la rama correcta con los cambios listos:
   \`\`\`bash
   git status
   \`\`\`

2. Linkear el CLI al proyecto de producción (solo la primera vez):
   \`\`\`bash
   supabase link --project-ref <project-ref>
   \`\`\`

3. Revisar qué migraciones se van a aplicar (dry run):
   \`\`\`bash
   supabase db diff
   \`\`\`

4. Aplicar migraciones:
   \`\`\`bash
   supabase db push
   \`\`\`

5. Verificar en Supabase Dashboard → Table Editor que el schema es correcto.

6. Hacer merge/push a `main` → Vercel despliega automáticamente.

## IMPORTANTE
- Nunca hacer merge a `main` con cambios de schema sin haber corrido `supabase db push` primero.
- Si el deploy de Vercel falla después de una migración, revisar los logs de Supabase.
```

### Sección a agregar en `README.md`

```markdown
## Deployment

La app se despliega automáticamente en [boxora.website](https://boxora.website) via Vercel
cuando se hace push a `main`.

⚠️ **Si tu PR incluye cambios de schema de BD**, correr migraciones antes de hacer merge:
Ver [docs/deployment/migrations.md](docs/deployment/migrations.md).
```

### Key Constraints

- Verificar que `supabase/migrations/` tiene los archivos de migración correctos antes de
  documentar el proceso.
- No incluir el `project-ref` o credenciales reales en el documento — usar placeholders.

---

## Acceptance Criteria

- [ ] `docs/deployment/migrations.md` creado con el proceso completo documentado.
- [ ] `README.md` tiene sección "Deployment" con referencia a la guía.
- [ ] El comando `supabase link --project-ref <ref>` funciona contra producción (verificado localmente).
- [ ] El directorio `supabase/migrations/` contiene los archivos `.sql` de migraciones.

---

## Test Specification

> Verificación manual — no aplica test automatizado (tarea de documentación).

```
✅ Check 1: docs/deployment/migrations.md existe y es legible
✅ Check 2: README.md tiene sección "Deployment"
✅ Check 3: supabase link --project-ref <ref> → "Linked project" sin errores
✅ Check 4: supabase db diff → muestra diff correcto (o "No schema changes")
✅ Check 5: ls supabase/migrations/ → archivos .sql presentes
```

---

## Agent Instructions

Cuando ejecutes esta tarea:

1. **Verifica** que TASK-025 está en `tasks/completed/`.
2. **Actualiza status** en `sdd/tasks/.index.json` → `"in-progress"`.
3. **Lee** `README.md` actual antes de modificarlo.
4. **Crea** `docs/deployment/migrations.md` con el contenido descrito.
5. **Modifica** `README.md` agregando la sección de deployment.
6. **Verifica** todos los acceptance criteria.
7. **Mueve este archivo** a `sdd/tasks/completed/TASK-028-migration-process-docs.md`.
8. **Actualiza el índice** → `"done"`.
9. **Completa** la Completion Note abajo.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: <session or agent ID>
**Date**: YYYY-MM-DD
**Notes**: Cualquier ajuste al proceso documentado vs. lo real.

**Deviations from spec**: none | describe if any
