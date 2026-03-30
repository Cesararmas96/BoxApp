# TASK-027: Configurar dominio personalizado boxora.website

**Feature**: Despliegue a Vercel (FEAT-006)
**Spec**: `sdd/specs/despliegue-vercel.spec.md`
**Status**: pending
**Priority**: high
**Estimated effort**: S (< 2h) + tiempo de propagación DNS (hasta 48h)
**Depends-on**: TASK-025, TASK-026
**Assigned-to**: unassigned

---

## Context

La app ya funciona en el subdominio `.vercel.app`. Este task conecta el dominio propio
`boxora.website` (comprado en Namecheap) a Vercel configurando los registros DNS correctos.
SSL se gestiona automáticamente por Vercel vía Let's Encrypt.
Implementa el **Módulo 3** del spec FEAT-006.

---

## Scope

- Añadir `boxora.website` como dominio en el proyecto Vercel.
- Configurar los registros DNS en Namecheap (A record y CNAME).
- Verificar propagación DNS y activación del certificado SSL.
- Confirmar que `https://boxora.website` sirve la app correctamente.

**NOT in scope**: lógica de la app, migraciones (TASK-028), env vars (ya en TASK-026).

---

## Files to Create / Modify

> No se requieren cambios de código. Esta tarea es 100% configuración DNS y Vercel.

---

## Implementation Notes

### Paso 1 — Agregar dominio en Vercel

1. Ir al proyecto BoxApp en Vercel → **Settings** → **Domains**.
2. Escribir `boxora.website` → **Add**.
3. Vercel mostrará los registros DNS que hay que configurar en Namecheap.
   Tomar nota de los valores exactos que Vercel proporcione (pueden variar).

### Paso 2 — Configurar DNS en Namecheap

Ir a Namecheap → **Domain List** → `boxora.website` → **Manage** → **Advanced DNS**:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `76.76.21.21` | Automatic |
| CNAME Record | `www` | `cname.vercel-dns.com` | Automatic |

> ⚠️ Eliminar cualquier registro A o CNAME previo que pueda conflictuar.
> Si Namecheap tiene "Parking Page" o registros por defecto, eliminarlos primero.

### Paso 3 — Verificar en Vercel

- Vercel verificará automáticamente los DNS (puede tardar minutos o hasta 48h).
- En Settings → Domains, el dominio cambiará de ⚠️ a ✅ cuando propague.
- El certificado SSL se genera automáticamente al verificar el dominio.

### Paso 4 — Actualizar Supabase Auth (si aún no se hizo en TASK-026)

Supabase → Auth → URL Configuration:
- **Site URL**: `https://boxora.website`
- **Redirect URLs**: incluir `https://boxora.website/**`

### Verificar propagación DNS

```bash
# Verificar desde terminal (puede tardar horas)
dig boxora.website A +short
# Debe devolver: 76.76.21.21

dig www.boxora.website CNAME +short
# Debe devolver: cname.vercel-dns.com

# Alternativa online: https://dnschecker.org
```

### Key Constraints

- La propagación DNS es asíncrona. Usar `https://<proyecto>.vercel.app` mientras tanto.
- Vercel maneja el redirect de `www` → apex automáticamente una vez el CNAME está configurado.
- No es necesario configurar SSL manualmente — Vercel lo gestiona.

---

## Acceptance Criteria

- [ ] `boxora.website` aparece en Vercel → Settings → Domains con ✅ (verificado).
- [ ] `https://boxora.website` carga la app correctamente en el browser.
- [ ] El certificado HTTPS está activo (candado verde).
- [ ] `https://www.boxora.website` redirige a `https://boxora.website`.
- [ ] Login funciona desde el dominio propio.
- [ ] `dig boxora.website A` devuelve `76.76.21.21` (o la IP que Vercel asigne).

---

## Test Specification

> Verificación manual — no aplica test automatizado (tarea de infra/DNS).

```
✅ Check 1: dig boxora.website A → 76.76.21.21
✅ Check 2: https://boxora.website → app carga sin errores
✅ Check 3: https://boxora.website/<ruta-interna> + F5 → no da 404 (SPA routing OK)
✅ Check 4: Certificado SSL válido (no expired, no self-signed)
✅ Check 5: https://www.boxora.website → redirect a https://boxora.website
✅ Check 6: Login con credenciales de producción → exitoso
```

---

## Agent Instructions

Cuando ejecutes esta tarea:

1. **Verifica** que TASK-025 y TASK-026 están en `tasks/completed/`.
2. **Actualiza status** en `sdd/tasks/.index.json` → `"in-progress"`.
3. **Ejecuta** los pasos en Vercel Dashboard y Namecheap.
4. **Espera** propagación DNS (puede ser instantáneo o hasta 48h).
5. **Verifica** todos los acceptance criteria.
6. **Mueve este archivo** a `sdd/tasks/completed/TASK-027-custom-domain-dns.md`.
7. **Actualiza el índice** → `"done"`.
8. **Completa** la Completion Note abajo.

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: <session or agent ID>
**Date**: YYYY-MM-DD
**Notes**: Tiempo de propagación DNS observado, cualquier issue con registros existentes en Namecheap.

**Deviations from spec**: none | describe if any
