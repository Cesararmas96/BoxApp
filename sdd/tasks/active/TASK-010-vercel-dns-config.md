# TASK-010: Configure Vercel wildcard subdomain + DNS (Namecheap)

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 9
**Status**: pending
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: unassigned

---

## Context

Para que `{slug}.boxora.website` funcione, se necesita: (1) un registro DNS wildcard en Namecheap, (2) que Vercel acepte el dominio wildcard y lo sirva con el mismo build de la SPA, y (3) que Supabase permita las requests desde los subdominios. Este task es **infraestructura one-time**, no código de aplicación. La mayoría de pasos son en dashboards web, no en el repositorio.

---

## Scope

- Verificar/actualizar `vercel.json` para asegurarse de que el SPA rewrite funciona en subdominios.
- Documentar los pasos exactos de configuración en Namecheap y Vercel Dashboard.
- Documentar la configuración necesaria en Supabase Auth (site URLs para OAuth).
- Verificar que el build de producción funciona en un subdominio con una URL de preview de Vercel.

**NOT in scope**: Custom domains por tenant. Configuración de Cloudflare. Certificados TLS manuales (Vercel los gestiona automáticamente).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `vercel.json` | VERIFY/MODIFY | Confirmar que el rewrite SPA es compatible con subdominios |
| `sdd/tasks/active/TASK-010-vercel-dns-config.md` | — | Este mismo archivo (documentación de pasos) |

---

## Implementation Notes

### Paso 1: Namecheap DNS — Registro Wildcard

1. Entrar a **Namecheap → Domain List → boxora.website → Manage → Advanced DNS**.
2. Añadir un registro CNAME:
   - **Host**: `*` (wildcard)
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: Automático
3. Verificar que el registro `@` (root) también apunta a Vercel (ya debe estar configurado).
4. **Nota**: La propagación DNS puede tardar entre 30 minutos y 24 horas.

```
# Registros DNS esperados en Namecheap:
@     CNAME   cname.vercel-dns.com    (dominio principal)
www   CNAME   cname.vercel-dns.com    (www)
*     CNAME   cname.vercel-dns.com    (wildcard — NUEVO)
```

### Paso 2: Vercel Dashboard — Añadir Wildcard Domain

1. Ir a **Vercel → BoxApp project → Settings → Domains**.
2. Añadir dominio: `*.boxora.website`
3. Vercel pedirá verificar el DNS — el registro CNAME del paso anterior debe ya estar configurado.
4. Esperar a que el estado cambie a "Valid Configuration" (puede tardar).

**Nota sobre el plan Hobby de Vercel**: Vercel Hobby **sí soporta wildcard domains** para proyectos con dominio propio. No se requiere plan Pro.

### Paso 3: vercel.json — Verificar rewrite SPA

El `vercel.json` actual ya tiene el rewrite correcto:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Este rewrite aplica a **todos los dominios** que sirve el proyecto, incluyendo subdominios. **No se requiere cambio**.

Sin embargo, verificar que no hay un `headers` o `routes` que interfiera con subdominios.

### Paso 4: Supabase Auth — Site URLs

1. Ir a **Supabase Dashboard → Authentication → URL Configuration**.
2. En **Site URL**: asegurarse de que está `https://boxora.website`.
3. En **Redirect URLs** (Additional Redirect URLs), añadir:
   ```
   https://*.boxora.website/**
   https://*.boxora.website/auth/callback
   ```
4. **Para Google OAuth**: ir a **Authentication → Providers → Google** y verificar que el redirect URI configurado en Google Cloud Console incluye `https://*.boxora.website/auth/callback` O usar el redirect URI de Supabase directamente (recomendado).

**Nota sobre OAuth wildcard en Google Console**: Google OAuth no soporta wildcards en URIs. La solución estándar es usar el redirect URI de Supabase (`https://<project>.supabase.co/auth/v1/callback`) como redirect URI en Google Cloud Console — Supabase maneja el redirect final. Verificar que este flujo ya está configurado así.

### Paso 5: Variables de entorno en Vercel

Verificar en **Vercel → Settings → Environment Variables** que:
- `VITE_SUPABASE_URL` está configurada
- `VITE_SUPABASE_ANON_KEY` está configurada

Estas variables deben estar disponibles para **Production**, **Preview** y **Development**.

### Paso 6: Verificación

Una vez configurado todo:

```bash
# Verificar DNS con dig (desde terminal local)
dig CNAME crossfit-demo.boxora.website
# Esperado: crossfit-demo.boxora.website → cname.vercel-dns.com

# Verificar que la app carga
curl -I https://crossfit-demo.boxora.website
# Esperado: HTTP/2 200 (servido por Vercel)

# Verificar que el tenant resolver funciona
# Abrir en browser: https://crossfit-demo.boxora.website
# → Debe mostrar el Login con el branding de crossfit-demo
```

### Key Constraints

- **Solo uno de estos registros DNS a la vez**: si ya existe un registro `*` CNAME en Namecheap, actualizarlo en lugar de añadir uno nuevo.
- **Vercel Hobby y custom domains**: Vercel permite hasta 50 dominios por proyecto en el plan Hobby. El wildcard cuenta como 1 dominio.
- **No modificar `vercel.json`** a menos que el rewrite SPA no funcione en subdominios (verificar primero).
- Este task puede completarse **en paralelo** con los otros tasks de código — es infra independiente.

### References en codebase

- `vercel.json` — verificar rewrite existente
- `src/utils/tenant.ts` (TASK-002) — usa `MAIN_DOMAIN = 'boxora.website'`

---

## Acceptance Criteria

- [ ] El registro DNS `*.boxora.website → cname.vercel-dns.com` existe en Namecheap
- [ ] `*.boxora.website` aparece como dominio válido en Vercel Dashboard
- [ ] `https://crossfit-demo.boxora.website` carga la app (HTTP 200)
- [ ] La app en el subdominio muestra el branding correcto del box `crossfit-demo`
- [ ] `https://boxora.website/login` sigue funcionando (sin subdominio)
- [ ] El OAuth de Google redirige correctamente desde subdominios de tenant
- [ ] `vercel.json` no necesitó cambios (verificado)

---

## Test Specification

Tests de infraestructura (post-deploy):

```bash
# 1. DNS propagado
dig +short CNAME crossfit-demo.boxora.website
# → cname.vercel-dns.com (o IPs de Vercel)

# 2. HTTPS activo
curl -sI https://crossfit-demo.boxora.website | head -5
# → HTTP/2 200

# 3. Rewrite SPA funciona en subdomain
curl -sI https://crossfit-demo.boxora.website/dashboard | head -5
# → HTTP/2 200 (no 404)

# 4. Google OAuth redirect (manual)
# Abrir https://crossfit-demo.boxora.website/login
# Click "Entrar con Google"
# → Autenticar → volver al subdominio correctamente
```

---

## Agent Instructions

1. **No hay dependencias de código** — puede ejecutarse antes que cualquier otro task
2. Leer `vercel.json` para verificar el rewrite actual
3. Seguir los pasos del Namecheap → Vercel → Supabase en ese orden
4. Documentar cualquier diferencia encontrada respecto a lo descrito
5. Ejecutar los 4 tests de infraestructura
6. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: —
**Date**: —
**Notes**: —
**Deviations from spec**: none
