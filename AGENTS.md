# BoxApp — Agent Context

> Este archivo es leído automáticamente por los agentes (Antigravity, Claude Code) al iniciar.
> Contiene convenciones del proyecto, arquitectura y datos de desarrollo.

---

## Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Radix UI / shadcn
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Routing**: React Router v6
- **Multi-tenant**: slug via `?box=<slug>` (dev) / subdomain (prod: `*.boxora.website`)
- **Deploy**: Vercel

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/contexts/TenantContext.tsx` | Resuelve el box actual por slug |
| `src/contexts/AuthContext.tsx` | Sesión, perfil, isRoot, currentBox |
| `src/utils/tenant.ts` | `getTenantSlug()`, `buildTenantUrl()` |
| `src/App.tsx` | Router principal, guards de super-admin |
| `sdd/tasks/.index.json` | Estado de todas las tasks SDD |

## Convenciones

- Super-admin se detecta por `user_metadata.is_root === true` (Supabase auth)
- Root NO tiene `box_id` en su profile (`NULL`)
- Roles disponibles: `admin`, `coach`, `athlete`, `receptionist`
- Migraciones SQL van en `sdd/tasks/completed/` con su task

---

## Entorno de Desarrollo — Seed Data

> Credenciales para desarrollo y QA local. Ver spec completo en `sdd/specs/creacion-data.spec.md`.

### URLs de login

| Box        | Dev URL                                          | Prod URL                                |
|------------|--------------------------------------------------|-----------------------------------------|
| Iron Box   | `http://localhost:5173/login?box=iron-box`       | `https://iron-box.boxora.website/login` |
| Wolf Box   | `http://localhost:5173/login?box=wolf-box`       | `https://wolf-box.boxora.website/login` |
| Tiger Box  | `http://localhost:5173/login?box=tiger-box`      | `https://tiger-box.boxora.website/login`|
| **Root**   | `http://localhost:5173/login` *(sin `?box`)*     | `https://boxora.website/login`          |

### Usuario Root (super-admin global)

| Campo    | Valor               |
|----------|---------------------|
| Email    | `root@boxapp.seed`  |
| Password | `Root@2024!`        |
| Rol      | admin (todas las boxes) |

### Usuarios de box (password: `Seed@2024!`)

Patrón de email: `{rol}{n}@{box-slug}.seed`

| Rol           | Iron Box                    | Wolf Box                    | Tiger Box                    |
|---------------|-----------------------------|-----------------------------|------------------------------|
| `admin`       | `admin1@iron-box.seed`      | `admin1@wolf-box.seed`      | `admin1@tiger-box.seed`      |
| `coach`       | `coach1@iron-box.seed`      | `coach1@wolf-box.seed`      | `coach1@tiger-box.seed`      |
| `athlete`     | `athlete1@iron-box.seed`    | `athlete1@wolf-box.seed`    | `athlete1@tiger-box.seed`    |
| `receptionist`| `reception1@iron-box.seed`  | `reception1@wolf-box.seed`  | `reception1@tiger-box.seed`  |

> Hay 3 usuarios por rol por box (`admin1`, `admin2`, `admin3`, etc.)

### Box IDs (Supabase)

| Box        | ID                                        |
|------------|-------------------------------------------|
| Iron Box   | `beef0001-0000-4000-8000-000000000000`    |
| Wolf Box   | `beef0002-0000-4000-8000-000000000000`    |
| Tiger Box  | `beef0003-0000-4000-8000-000000000000`    |
