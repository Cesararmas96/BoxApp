# Dev Seed Data — Boxes & Credenciales

> Datos de desarrollo en Supabase. Ver spec completo: `sdd/specs/creacion-data.spec.md`

## Login URLs (dev local)

- **Iron Box**: `http://localhost:5173/login?box=iron-box`
- **Wolf Box**: `http://localhost:5173/login?box=wolf-box`
- **Tiger Box**: `http://localhost:5173/login?box=tiger-box`
- **Root (sin box)**: `http://localhost:5173/login`

## Credenciales

| Usuario         | Email                   | Password     | Rol       | Box       |
|-----------------|-------------------------|--------------|-----------|-----------|
| Super-Admin     | `root@boxapp.seed`      | `Root@2024!` | admin     | global    |
| Admin Iron      | `admin1@iron-box.seed`  | `Seed@2024!` | admin     | Iron Box  |
| Coach Wolf      | `coach1@wolf-box.seed`  | `Seed@2024!` | coach     | Wolf Box  |
| Athlete Tiger   | `athlete1@tiger-box.seed`| `Seed@2024!`| athlete   | Tiger Box |
| Reception Iron  | `reception1@iron-box.seed`|`Seed@2024!`| receptionist | Iron Box |

> Patrón: `{rol}{1-3}@{box-slug}.seed` — hay 3 usuarios por rol por box.

## Detección de Root

El super-admin se detecta en `AuthContext` por:
```ts
session?.user?.user_metadata?.is_root === true
// ó email === 'root@test.com' (legacy)
```
El usuario `root@boxapp.seed` tiene `is_root: true` en `user_metadata`.
