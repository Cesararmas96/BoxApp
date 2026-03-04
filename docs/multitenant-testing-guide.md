# Guía de Testing Multi-Tenant

> **Documento de referencia completo:** `docs/multitenant-architecture.md`

---

## Tenants disponibles

### Box A — CrossFit Arena (seed completo)
- **URL dev:** `http://localhost:5173/?box=<slug-box-a>`
- **Admin seed:** `silvia.rodriguez.45@example.com`
- **Datos:** 40 atletas, 5 coaches, 5 planes

### Box B — CrossFit Beta (tenant de aislamiento)
- **URL dev:** `http://localhost:5173/?box=crossfit-beta`

| Email | Password | Rol |
|---|---|---|
| `admin@boxb.test` | `Admin1234!` | admin |
| `coach@boxb.test` | `Coach1234!` | coach |
| `athlete@boxb.test` | `Athlete1234!` | athlete |

### SuperAdmin
- **URL dev:** `http://localhost:5173/` (sin `?box=`)
- **Email:** `root@test.com`

---

## Tests de validación

### TEST 1 — Resolución de tenant

| URL | Resultado esperado |
|---|---|
| `/?box=crossfit-beta` | Carga "CrossFit Beta" |
| `/?box=slug-invalido` | Pantalla "Box no encontrado" |
| `/` sin `?box=` | Main domain / login SuperAdmin |

**Verificar en consola:** busca logs `[TenantContext]`.

---

### TEST 2 — Persistencia de tenant en dev

1. Ir a `/?box=crossfit-beta` → se carga el box
2. Navegar a `/dashboard` (URL queda sin `?box=`)
3. Hacer **refresh** en `/dashboard`
4. ✅ El box debe mantenerse (no debe caer al login sin contexto)

**Mecanismo:** `sessionStorage['dev_tenant_slug']` guarda el slug.

---

### TEST 3 — Login por tenant

| Acción | Resultado esperado |
|---|---|
| Login `admin@boxb.test` en `/?box=crossfit-beta` | ✅ Accede al dashboard |
| Login usuario de Box A en `/?box=crossfit-beta` | ❌ Error o redirect |
| Login `root@test.com` en `/` (sin box) | ✅ Panel SuperAdmin |

---

### TEST 4 — Aislamiento de datos (RLS)

Logueado como `admin@boxb.test`:

- `/members` → solo muestra 1 atleta (Pedro Beta), **no** los 40 de Box A
- `/billing` → solo muestra gastos de Box B
- Abrir DevTools → Network → cualquier query a Supabase debe retornar solo filas de Box B

Logueado como `athlete@boxb.test`:

- `/members` → redirige (rol insuficiente)
- `/billing` → redirige (rol insuficiente)

---

### TEST 5 — Control de roles dentro del tenant

| Ruta | athlete | coach | admin |
|---|:---:|:---:|:---:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/wods` | ✅ | ✅ | ✅ |
| `/members` | ❌ | ✅ | ✅ |
| `/leads` | ❌ | ❌ | ✅ |
| `/billing` | ❌ | ❌ | ✅ |
| `/analytics` | ❌ | ❌ | ✅ |
| `/roles` | ❌ | ❌ | ✅ |

---

### TEST 6 — SuperAdmin: visibilidad global

1. Login con `root@test.com` en `http://localhost:5173/`
2. Ir a `/admin`
3. ✅ Ambos boxes deben aparecer en la lista (Box A + Box B)
4. ✅ Puede cambiar `subscription_status` de cualquier box

---

### TEST 7 — Suspensión de tenant

```sql
-- Suspender Box B (ejecutar en Supabase SQL Editor)
UPDATE public.boxes
SET subscription_status = 'suspended'
WHERE id = 'bbbbbbbb-0000-4000-a000-000000000001';
```

1. Ir a `/?box=crossfit-beta`
2. ✅ Muestra pantalla de suspensión (bloqueado, sin login)
3. Reactivar desde SuperAdmin UI o SQL:

```sql
UPDATE public.boxes
SET subscription_status = 'active'
WHERE id = 'bbbbbbbb-0000-4000-a000-000000000001';
```

4. ✅ Acceso restaurado

---

### TEST 8 — Auto-registro de nuevo box

1. Ir a `http://localhost:5173/register`
2. Completar Paso 1: nombre, slug único, país
3. Completar Paso 2: email y contraseña del admin
4. ✅ Box creado con `subscription_status = 'trial'`
5. ✅ Redirige a `/?box=<nuevo-slug>`

---

## Checklist completo

- [ ] Box B carga en `/?box=crossfit-beta`
- [ ] Slug inválido muestra "Box no encontrado"
- [ ] Refresh en `/dashboard` mantiene el tenant
- [ ] Sign-out limpia el tenant de sesión
- [ ] Login `admin@boxb.test` funciona con `Admin1234!`
- [ ] Login `coach@boxb.test` funciona con `Coach1234!`
- [ ] Login `athlete@boxb.test` funciona con `Athlete1234!`
- [ ] Admin Box B no ve miembros de Box A
- [ ] Admin Box A no ve datos de Box B
- [ ] Athlete no accede a `/members` ni `/billing`
- [ ] SuperAdmin ve ambos boxes en `/admin`
- [ ] Suspender Box B bloquea toda la UI
- [ ] Reactivar Box B restaura el acceso
- [ ] Nuevo box via `/register` inicia en `trial`
