# TASK-026: Configurar variables de entorno de producción en Vercel

**Feature**: Despliegue a Vercel (FEAT-006)
**Spec**: `sdd/specs/despliegue-vercel.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: TASK-025
**Assigned-to**: unassigned

---

## Context

Sin las variables de entorno de Supabase, la app carga pero no puede autenticar ni
consultar datos. Este task carga las 2 variables requeridas en Vercel y también
actualiza la configuración de Supabase Auth para aceptar el dominio de producción.
Implementa el **Módulo 2** del spec FEAT-006.

---

## Scope

- Cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel → Environment Variables → Production.
- Agregar `https://boxora.website` a las URLs permitidas en Supabase Auth.
- Re-desplegar en Vercel para que las env vars tengan efecto.
- Verificar que el login funciona con credenciales de producción.

**NOT in scope**: dominio personalizado (TASK-027), migraciones (TASK-028).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `.env.example` | VERIFY | Confirmar que lista exactamente estas 2 variables |

> No se requieren cambios de código. Esta tarea es configuración en Vercel Dashboard y Supabase Dashboard.

---

## Implementation Notes

### Paso 1 — Variables en Vercel Dashboard

1. Ir al proyecto BoxApp en Vercel → **Settings** → **Environment Variables**.
2. Agregar:
   - **Name**: `VITE_SUPABASE_URL` | **Value**: `<URL del proyecto Supabase prod>` | **Environment**: ✅ Production
   - **Name**: `VITE_SUPABASE_ANON_KEY` | **Value**: `<anon key de Supabase prod>` | **Environment**: ✅ Production
3. **No marcar** Preview ni Development (solo Production).
4. Guardar.

### Paso 2 — Supabase Auth URL Configuration

En Supabase Dashboard → proyecto de producción → **Authentication** → **URL Configuration**:

- **Site URL**: `https://boxora.website`
- **Additional Redirect URLs**: agregar `https://boxora.website/**`

> ⚠️ Sin este paso, Supabase rechazará los redirects de OAuth y magic links desde el dominio de producción.

### Paso 3 — Re-deploy

Desde Vercel Dashboard → **Deployments** → hacer clic en **Redeploy** en el último deployment
(o simplemente hacer un push vacío a `main`).

### Dónde encontrar las credenciales de Supabase

Supabase Dashboard → proyecto de producción → **Settings** → **API**:
- **Project URL** → es el valor de `VITE_SUPABASE_URL`
- **anon / public key** → es el valor de `VITE_SUPABASE_ANON_KEY`

### Key Constraints

- Usar **solo** las claves `anon/public`. La `service_role` key **NO** debe cargarse en Vercel
  porque quedaría expuesta en el bundle del cliente.
- Las variables `VITE_*` son expuestas al cliente por Vite — nunca poner secrets aquí.

---

## Acceptance Criteria

- [ ] Las 2 env vars aparecen en Vercel → Settings → Environment Variables con scope `Production`.
- [ ] El re-deploy post-configuración termina con status `Ready`.
- [ ] `https://<proyecto>.vercel.app` → el login funciona (Supabase responde correctamente).
- [ ] Supabase Auth tiene `https://boxora.website` en Site URL y Redirect URLs.

---

## Test Specification

> Verificación manual — no aplica test automatizado (tarea de infra/configuración).

```
✅ Check 1: Vercel env vars → VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY presentes en Production
✅ Check 2: https://<proyecto>.vercel.app → pantalla de login carga sin errores de consola
✅ Check 3: Login con admin1@iron-box.seed / Seed@2024! → autenticación exitosa
✅ Check 4: Supabase Dashboard → Auth → Site URL = https://boxora.website
```

---

## Agent Instructions

Cuando ejecutes esta tarea:

1. **Verifica** que TASK-025 está en `tasks/completed/`.
2. **Actualiza status** en `sdd/tasks/.index.json` → `"in-progress"`.
3. **Ejecuta** los pasos en Vercel y Supabase Dashboard descritos arriba.
4. **Verifica** todos los acceptance criteria.
5. **Mueve este archivo** a `sdd/tasks/completed/TASK-026-vercel-env-vars.md`.
6. **Actualiza el índice** → `"done"`.
7. **Completa** la Completion Note abajo.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: <session or agent ID>
**Date**: YYYY-MM-DD
**Notes**: Confirmar que login funciona en la URL `.vercel.app`.

**Deviations from spec**: none | describe if any
