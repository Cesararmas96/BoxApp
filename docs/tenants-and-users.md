# Tenants y Usuarios — BoxApp Dev

> Referencia rápida de todos los boxes y credenciales disponibles en el entorno de desarrollo.
> Puerto local: **http://localhost:5173**

---

## SuperAdmin (acceso global)

| Campo | Valor |
|---|---|
| Email | `root@test.com` |
| Password | *(ver 1Password / equipo)* |
| URL dev | `http://localhost:5173/` (sin `?box=`) |
| Panel | `http://localhost:5173/admin` |
| Acceso | Ve y gestiona **todos** los boxes |

> **Comportamiento esperado desde el panel SuperAdmin:**
> - "Visitar Box" abre el box en nueva pestaña (`/dashboard?box=<slug>` en dev).
> - El root user siempre ve los datos del box que está visitando, no los de su propio perfil.
> - Puede inspeccionar boxes suspendidos sin ser bloqueado por la pantalla de suspensión.

---

## Boxes registrados

### 1. AreaPrincipal
| Campo | Valor |
|---|---|
| Slug | `principal` |
| URL dev | `http://localhost:5173/?box=principal` |
| URL prod | `https://principal.boxora.website` |
| Status | `active` |
| Datos | Seed completo — 40 atletas, 5 coaches, 5 admins, 5 planes |

#### Usuarios de AreaPrincipal

| Email | Password | Rol |
|---|---|---|
| `admin@test.com` | *(ver equipo)* | admin |
| `coach@test.com` | *(ver equipo)* | coach |
| `reception@test.com` | *(ver equipo)* | receptionist |
| `athlete@test.com` | *(ver equipo)* | athlete |
| `carmas@trocglobal.com` | *(personal)* | coach |

---

### 2. BoxText
| Campo | Valor |
|---|---|
| Slug | `boxtext` |
| URL dev | `http://localhost:5173/?box=boxtext` |
| Status | `active` |

---

### 3. arena
| Campo | Valor |
|---|---|
| Slug | `arena` |
| URL dev | `http://localhost:5173/?box=arena` |
| Status | `active` |

---

### 4. CrossFit Beta ← box de testing de aislamiento multi-tenant
| Campo | Valor |
|---|---|
| Slug | `crossfit-beta` |
| URL dev | `http://localhost:5173/?box=crossfit-beta` |
| URL prod | `https://crossfit-beta.boxora.website` |
| Status | `active` |

#### Usuarios de CrossFit Beta

| Email | Password | Rol |
|---|---|---|
| `admin@boxb.test` | `Admin1234!` | admin |
| `coach@boxb.test` | `Coach1234!` | coach |
| `athlete@boxb.test` | `Athlete1234!` | athlete |

---

## Resumen de lo creado en esta sesión

| Elemento | Detalle |
|---|---|
| Box nuevo | **CrossFit Beta** (`crossfit-beta`) |
| Usuarios auth creados | 3 (`admin@boxb.test`, `coach@boxb.test`, `athlete@boxb.test`) |
| Perfiles creados | 3 (admin, coach, athlete) vinculados al box |
| Planes creados | 3 (Starter $60, Pro $100, Elite $150) |
| Membresía de prueba | Pedro Beta en plan Pro |
| Gasto de prueba | Renta mensual $800 |

---

## Notas técnicas

- En **producción** las URLs son subdominio: `https://{slug}.boxora.website`
- En **desarrollo** el tenant se pasa por query param: `?box={slug}`
- El slug persiste en `sessionStorage` para sobrevivir la navegación SPA (no se pierde al ir a `/dashboard`)
- Para limpiar el tenant: hacer sign-out (limpia `sessionStorage` automáticamente)
- Si un usuario no tiene contraseña conocida, el admin puede resetearla a `12345678` desde el panel de miembros (el usuario deberá cambiarla en su próximo login)

---

## Bugs corregidos (2026-03-06) — TASK-021

| Bug | Causa | Fix |
|---|---|---|
| "Visitar Box" no funcionaba | `navigate('/?box=slug')` era capturado por Route `/` y redirigía a `/admin`, perdiendo el query param | `window.open('/dashboard?box=slug', '_blank')` — nueva pestaña, saltea la redirección |
| Datos compartidos entre boxes | `tenantBoxId` se escribía a la DB al visitar cualquier subdominio, sobreescribiendo el `box_id` del perfil | `tenantBoxId` es ahora **solo lectura** — solo `pending_box_id` (OAuth) escribe a la DB |
| Root siempre veía CrossFit Beta | Su perfil en DB tenía `box_id` apuntando a CrossFit Beta; el fallback `tenantBoxId` nunca se usaba | Para root: `currentBox = tenantBoxId` siempre (ignorar `profileData.box_id`) |
| Root bloqueado en boxes suspendidos | Guard `isSuspended` corría antes del check `isRoot` | `isSuspended && !isRoot` — root bypasa la pantalla de suspensión |
