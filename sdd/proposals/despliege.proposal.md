# Feature Proposal: Despliegue a Vercel

**Date**: 2026-03-15
**Author**: TBD
**Status**: accepted
**Spec**: `sdd/specs/despliegue-vercel.spec.md` (FEAT-006)

---

## Why

La app BoxApp (React + Vite SPA) está lista para salir de desarrollo local. Se dispone de una
nueva cuenta de Vercel y el dominio `boxora.website` comprado en Namecheap. El objetivo es
tener un entorno de **producción real** accesible públicamente, conectado al proyecto Supabase
de producción. No existe ningún entorno de staging configurado actualmente.

## What Changes

- La app BoxApp estará disponible en `boxora.website` (DNS gestionado en Namecheap → Vercel).
- Los pushes a la rama `main` dispararán builds y deployments automáticos en Vercel.
- Las variables de entorno de Supabase (producción) estarán configuradas en el panel de Vercel.
- No se requieren cambios de adapter ni de framework (es una SPA estática con Vite).
- El archivo `vercel.json` ya existe y tiene las rewrites correctas para SPA.

## Capabilities

### New Capabilities
- `vercel-deployment`: Pipeline de CI/CD con Vercel conectado al repo GitHub. Deploy automático
  desde la rama `main`. Dominio `boxora.website` configurado vía Namecheap DNS.
- `production-env-config`: Variables de entorno de producción gestionadas en Vercel
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, y cualquier otra `VITE_*` necesaria).

### Modified Capabilities
<!-- ninguna -->

## Impact

- **Código**: ningún cambio requerido. `vercel.json` ya existe y está configurado.
- **`vite.config.ts`**: `boxora.website` ya está en `allowedHosts` ✅
- **Deploy pipeline**: conectar repo GitHub a Vercel, configurar `main` como rama de producción.
- **Variables de entorno** (solo 2): `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` — cargar en el panel de Vercel.
- **Dominio**: configurar DNS en Namecheap → apuntar `boxora.website` a Vercel (registros A o CNAME).
- **Supabase**: usar el proyecto Supabase de producción existente. Sin Edge Functions.
- **Migraciones**: el script `db:migrate` (`supabase db push`) corre en `predev` (local).
  Para producción, las migraciones se correrán **manualmente** antes de cada deploy hasta
  definir un pipeline de CI/CD para esto.

## Open Questions

- **Migraciones en CI/CD**: el `package.json` tiene `"predev": "npm run db:migrate"` solo para
  local. Para producción se necesita decidir:
  1. **Manual** (recomendado para empezar): correr `supabase db push --linked` antes de hacer merge a `main`.
  2. **GitHub Action**: step que corra migraciones antes del deploy de Vercel.
- **Preview Deployments**: ¿se quiere habilitar Vercel preview en PRs o solo producción en `main`?
