# Feature Specification: Despliegue a Vercel

**Feature ID**: FEAT-006
**Date**: 2026-03-15
**Author**: TBD
**Status**: approved
**Proposal**: `sdd/proposals/despliege.proposal.md`

---

## 1. Motivation & Business Requirements

### Problem Statement

BoxApp funciona únicamente en entorno local. No existe ningún entorno de producción ni staging
accesible públicamente. Se cuenta con una nueva cuenta de Vercel, el dominio `boxora.website`
registrado en Namecheap, y un proyecto Supabase de producción activo.

### Goals

- Desplegar BoxApp (React + Vite SPA) en producción en `boxora.website`.
- Automatizar el deploy desde la rama `main` vía Vercel CI/CD.
- Configurar el dominio propio con DNS en Namecheap.
- Documentar el proceso manual de migraciones de BD para producción.

### Non-Goals (explícitamente fuera de alcance)

- Configurar entorno de staging o preview deployments.
- Automatizar migraciones de BD en CI/CD (se hará manualmente en esta fase).
- Desplegar Edge Functions de Supabase (no existen actualmente).
- Cambios en la lógica o UI de la aplicación.

---

## 2. Architectural Design

### Overview

BoxApp es una SPA estática construida con React + Vite. El build produce archivos estáticos
en `dist/`. Vercel sirve estos archivos con las rewrites ya configuradas en `vercel.json`
para que el router del lado del cliente funcione correctamente.

### Component Diagram

```
GitHub (rama main)
        │  push
        ▼
   Vercel CI/CD
   ┌──────────────────────────────┐
   │  1. npm run build            │
   │  2. deploy dist/ → CDN Edge  │
   └──────────────────────────────┘
        │  sirve
        ▼
   boxora.website  ──→  Supabase (producción)
        ▲
   Namecheap DNS
   (A / CNAME → Vercel)
```

### Integration Points

| Componente existente | Tipo de integración | Notas |
|---|---|---|
| `vercel.json` | ya existe ✅ | rewrites SPA configuradas |
| `vite.config.ts` | ya existe ✅ | `boxora.website` en `allowedHosts` |
| `.env.example` | referencia | define las 2 vars de entorno necesarias |
| Supabase producción | consume | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |

### Variables de Entorno (producción)

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Solo estas 2 variables son requeridas (confirmado via `.env.example`).

---

## 3. Module Breakdown

### Módulo 1: Proyecto Vercel + GitHub CI/CD

- **Acción**: Crear proyecto en Vercel, importar repo GitHub, configurar rama `main` como producción.
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Install command**: `npm install`

### Módulo 2: Variables de Entorno en Vercel

- **Acción**: Cargar en Vercel Dashboard → Settings → Environment Variables:
  - `VITE_SUPABASE_URL` → entorno: Production
  - `VITE_SUPABASE_ANON_KEY` → entorno: Production
- **Scope**: solo `Production` (no Preview, no Development).

### Módulo 3: Dominio Personalizado

- **Acción**: Añadir `boxora.website` en Vercel Dashboard → Settings → Domains.
- **DNS en Namecheap**:
  - Registro `A` → `76.76.21.21` (IP de Vercel) para el apex `boxora.website`
  - Registro `CNAME` → `cname.vercel-dns.com` para `www.boxora.website`
- **SSL**: automático via Vercel (Let's Encrypt).

### Módulo 4: Proceso de Migraciones (manual)

- **Acción**: Documentar el proceso de migraciones para producción.
- **Flujo**:
  1. Antes de hacer merge a `main`, correr localmente:
     ```bash
     supabase link --project-ref <project-ref>
     supabase db push
     ```
  2. Verificar en Supabase Dashboard que las migraciones se aplicaron.
  3. Hacer merge/push a `main` → Vercel despliega automáticamente.

---

## 4. Test Specification

### Verificación manual post-deploy

| Check | Descripción |
|---|---|
| Build exitoso | El deploy en Vercel muestra status `Ready` |
| App carga en dominio | `https://boxora.website` carga la app sin errores |
| SPA routing funciona | Navegar a una ruta interna y hacer F5 — debe cargar (no 404) |
| Supabase conectado | Login funciona con credenciales de producción |
| HTTPS activo | El certificado SSL está activo (candado verde en browser) |
| `www` redirige | `https://www.boxora.website` redirige a `boxora.website` |

### Verificación DNS

```bash
# Verificar propagación DNS (puede tardar hasta 48h)
dig boxora.website A
dig www.boxora.website CNAME
```

---

## 5. Acceptance Criteria

> Este feature está completo cuando ALL de los siguientes son true:

- [ ] El proyecto existe en Vercel y está conectado al repo GitHub.
- [ ] Push a `main` dispara un build automático que termina en estado `Ready`.
- [ ] `https://boxora.website` carga la app correctamente.
- [ ] El router de la SPA funciona (refresh en rutas internas no da 404).
- [ ] Login con Supabase producción funciona correctamente.
- [ ] Certificado HTTPS activo y válido.
- [ ] DNS de `boxora.website` propagado y resolviendo a Vercel.
- [ ] El proceso de migraciones manuales está documentado en `docs/` o en este spec.

---

## 6. Implementation Notes & Constraints

### Orden de ejecución recomendado

1. **Primero**: crear proyecto en Vercel + conectar GitHub → verificar que el build funciona
   (con el subdominio `.vercel.app` antes de tocar DNS).
2. **Segundo**: cargar env vars en Vercel → verificar que Supabase conecta.
3. **Tercero**: configurar dominio en Vercel + DNS en Namecheap.
4. **Cuarto**: documentar proceso de migraciones.

### Known Risks / Gotchas

- **Propagación DNS**: puede tardar entre 5 min y 48h. Usar el subdominio `.vercel.app`
  para verificar funcionalidad mientras propaga.
- **CORS en Supabase**: si Supabase tiene URLs permitidas configuradas, agregar
  `https://boxora.website` a la lista de `Additional Redirect URLs` y `Site URL`
  en Supabase Dashboard → Auth → URL Configuration.
- **`VITE_` prefix**: las variables de entorno en Vite deben empezar con `VITE_`
  para ser expuestas al cliente. Ya es el caso en este proyecto ✅.
- **`predev` script**: el script `predev` corre `db:migrate` pero solo aplica en `npm run dev`.
  Vercel usa `npm run build`, así que las migraciones **no** corren automáticamente en CI/CD.

### External Dependencies

| Herramienta | Versión | Razón |
|---|---|---|
| Vercel CLI (opcional) | latest | Para deploy manual o debug local |
| Supabase CLI | instalado ✅ | Para correr migraciones de producción |

---

## 7. Open Questions

- [ ] **Preview Deployments**: ¿habilitar Vercel previews en PRs en el futuro? — *Owner: TBD*
- [ ] **CI/CD migraciones**: evaluar GitHub Action para automatizar `supabase db push` antes del deploy — *Owner: TBD*

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-03-15 | Agent | Draft inicial desde proposal `despliege.proposal.md` |
