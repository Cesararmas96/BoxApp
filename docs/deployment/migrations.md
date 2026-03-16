# Migraciones de Base de Datos — Producción

> Proceso manual para aplicar migraciones a Supabase antes de cada deploy a `main`.

## Pre-requisitos

- Supabase CLI instalado: `npm install -g supabase`
- Acceso al proyecto Supabase de producción
- `SUPABASE_PROJECT_REF` del proyecto (Supabase Dashboard → Settings → General → Reference ID)

## Proceso antes de cada deploy a main

### 1. Linkear el CLI al proyecto de producción

Solo necesario la primera vez, o si cambias de máquina:

```bash
supabase link --project-ref <project-ref>
```

Pedirá la `database password` del proyecto (Supabase Dashboard → Settings → Database → Database password).

### 2. Ver qué migraciones se van a aplicar

```bash
supabase db diff
```

Si no hay cambios pendientes: `"No schema changes found"`.

### 3. Aplicar migraciones

```bash
supabase db push
```

### 4. Verificar en Supabase Dashboard

Supabase Dashboard → **Table Editor** — confirmar que el schema se aplicó correctamente.

### 5. Hacer push a main

```bash
git push origin main
```

Vercel desplegará automáticamente.

---

## Migraciones existentes

| Archivo | Descripción |
|---|---|
| `20260206_create_avatars_bucket.sql` | Bucket de avatares en Storage |
| `20260208_security_audit_system.sql` | Sistema de auditoría de seguridad |
| `20260208_fix_audit_types.sql` | Fix en tipos de auditoría |
| `20260209_fix_competitions_schema.sql` | Schema de competencias |
| `20260209_fix_competitions_rls.sql` | RLS de competencias |
| `20260209_competition_module_full.sql` | Módulo completo de competencias |
| `20260210_competition_scoring.sql` | Sistema de puntuación |
| `20260214_clean_movements_schema.sql` | Schema de movimientos |
| `20260214_profiles_rls_members.sql` | RLS de perfiles y miembros |
| `20260215_full_crossfit_movements.sql` | Movimientos CrossFit completos |
| `20260215_admin_reset_password.sql` | Reset password para admin |
| `20260219_superadmin_rls.sql` | RLS para superadmin |
| `20260219_rls_multi_tenant_isolation.sql` | Aislamiento multi-tenant |
| `20260302_add_subscription_status.sql` | Campo subscription_status |
| `20260303_admin_panel.sql` | Panel administrativo |
| `20260306_superadmin_rls_all_tables.sql` | RLS bypass para superadmin en todas las tablas |

---

## Crear una nueva migración

```bash
supabase migration new <nombre-descriptivo>
# Crea: supabase/migrations/<timestamp>_<nombre>.sql
```

Edita el archivo `.sql` generado, luego sigue el proceso anterior.

---

## ⚠️ Regla de equipo

**Nunca hacer merge a `main` con cambios de schema sin haber corrido `supabase db push` primero.**

Si el deploy de Vercel falla después de una migración, revisar:
1. Logs de Vercel (build errors)
2. Supabase Dashboard → Logs → API
