# Tenants y Usuarios — BoxApp Dev

> Referencia rápida de todos los boxes y credenciales disponibles en el entorno de desarrollo.
> Puerto local: **http://localhost:5173**

---

## SuperAdmin (acceso global)

| Campo | Valor |
|---|---|
| Email | `root@test.com` |
| URL dev | `http://localhost:5173/` (sin `?box=`) |
| Panel | `http://localhost:5173/admin` |
| Acceso | Ve y gestiona **todos** los boxes |

---

## Boxes registrados

### 1. AreaPrincipal
| Campo | Valor |
|---|---|
| Slug | `principal` |
| URL dev | `http://localhost:5173/?box=principal` |
| Status | `active` |
| Datos | Seed completo — 40 atletas, 5 coaches, 5 admins, 5 planes |
| Admin seed | `silvia.rodriguez.45@example.com` |

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

### 4. CrossFit Beta ← creado para testing de aislamiento
| Campo | Valor |
|---|---|
| Slug | `crossfit-beta` |
| URL dev | `http://localhost:5173/?box=crossfit-beta` |
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
