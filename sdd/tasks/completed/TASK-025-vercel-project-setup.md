# TASK-025: Crear proyecto Vercel y conectar GitHub CI/CD

**Feature**: Despliegue a Vercel (FEAT-006)
**Spec**: `sdd/specs/despliegue-vercel.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: claude-sonnet-4-6

---

## Context

Primer paso del despliegue a producción. Vercel necesita importar el repositorio GitHub
para poder construir y desplegar la app automáticamente en cada push a `main`.
Esta tarea es el fundamento sobre el que se apoyan TASK-026 (env vars) y TASK-027 (dominio).
Implementa el **Módulo 1** del spec FEAT-006.

---

## Scope

- Crear un nuevo proyecto en Vercel importando el repositorio GitHub de BoxApp.
- Configurar el framework preset, build command, output directory e install command.
- Verificar que el build inicial finaliza con status `Ready` (usando el subdominio `.vercel.app`).
- Confirmar que push a `main` dispara un nuevo deploy automático.

**NOT in scope**: variables de entorno (TASK-026), dominio personalizado (TASK-027),
migraciones (TASK-028).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `vercel.json` | VERIFY | Ya existe — confirmar que rewrites están correctas |
| `vite.config.ts` | VERIFY | Ya existe — confirmar `allowedHosts` incluye `boxora.website` |

> No se requieren cambios de código. Esta tarea es 100% configuración en Vercel Dashboard.

---

## Implementation Notes

### Pasos en Vercel Dashboard

1. Ir a [vercel.com](https://vercel.com) → **Add New Project**.
2. Seleccionar **Import Git Repository** → autorizar acceso a GitHub si es necesario.
3. Seleccionar el repositorio `BoxApp`.
4. Configurar el proyecto:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (raíz del repo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. **NO agregar env vars todavía** (se hace en TASK-026 después).
6. Hacer clic en **Deploy**.

### `vercel.json` existente (verificar que contiene esto)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Key Constraints

- El primer deploy **fallará** en runtime (Supabase no conectará) porque las env vars
  no están cargadas aún. Eso es esperado — lo importante es que el **build compile** (status `Ready`).
- No renombrar el proyecto en Vercel — usar el nombre del repo directamente.

---

## Acceptance Criteria

- [ ] El proyecto aparece en el dashboard de Vercel con status `Ready`.
- [ ] La URL `.vercel.app` generada carga la app (aunque Supabase dé error de conexión).
- [ ] Un segundo push a `main` dispara un nuevo deploy automático visible en Vercel.
- [ ] El build log muestra `npm run build` exitoso sin errores de TypeScript.

---

## Test Specification

> Verificación manual — no aplica test automatizado (tarea de infra/configuración).

```
✅ Check 1: Vercel Dashboard → proyecto existe → status "Ready"
✅ Check 2: Build log → "Build Completed" sin errores
✅ Check 3: https://<proyecto>.vercel.app → app carga en el browser
✅ Check 4: git push origin main → Vercel crea nuevo deployment automáticamente
```

---

## Agent Instructions

Cuando ejecutes esta tarea:

1. **Lee el spec** en `sdd/specs/despliegue-vercel.spec.md` para contexto completo.
2. **Verifica dependencias** — esta tarea no tiene dependencias (none).
3. **Actualiza status** en `sdd/tasks/.index.json` → `"in-progress"`.
4. **Ejecuta** los pasos en Vercel Dashboard descritos arriba.
5. **Verifica** todos los acceptance criteria.
6. **Mueve este archivo** a `sdd/tasks/completed/TASK-025-vercel-project-setup.md`.
7. **Actualiza el índice** → `"done"`.
8. **Completa** la Completion Note abajo.

---

## Completion Note

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-15
**Notes**: Repo GitHub `Cesararmas96/BoxApp` conectado a Vercel exitosamente. Build automático desde rama `main` activo.

**Deviations from spec**: none
