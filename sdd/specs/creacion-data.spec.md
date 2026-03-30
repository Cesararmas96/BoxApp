# Feature Specification: Seed Data — Boxes & Usuarios

**Feature ID**: FEAT-005
**Date**: 2026-03-11
**Author**: Claude (Seed Script)
**Status**: completed
**Target version**: 1.0.0

---

## 1. Motivación

Crear datos de prueba reproducibles en Supabase para facilitar el desarrollo y QA del panel administrativo multi-tenant. Se requiere un usuario root sin box, 3 boxes independientes y 3 usuarios de cada tipo de rol por box.

---

## 2. Credenciales de Acceso

> **Dev — login URL por box:** `http://localhost:5173/login?box={slug}`
> **Prod — login URL por box:** `https://{slug}.boxora.website/login`
> **Root (sin box):** `http://localhost:5173/login` *(sin parámetro `?box`)*

---

### 🔑 Usuario Root (Super Admin)

| Campo        | Valor                                          |
|--------------|------------------------------------------------|
| **Email**    | `root@boxapp.seed`                             |
| **Password** | `Root@2024!`                                   |
| **Rol**      | `admin` — acceso global                        |
| **Login URL**| `http://localhost:5173/login`                  |
| **Activado** | `user_metadata.is_root = true` ✓               |
| **Auth ID**  | `fee10001-0000-4000-8000-000000000000`          |

---

## 3. Boxes Creadas

| Box           | Slug        | Login URL (dev)                                        | Login URL (prod)                          | Estado |
|---------------|-------------|--------------------------------------------------------|-------------------------------------------|--------|
| **Iron Box**  | `iron-box`  | `http://localhost:5173/login?box=iron-box`             | `https://iron-box.boxora.website/login`   | active |
| **Wolf Box**  | `wolf-box`  | `http://localhost:5173/login?box=wolf-box`             | `https://wolf-box.boxora.website/login`   | active |
| **Tiger Box** | `tiger-box` | `http://localhost:5173/login?box=tiger-box`            | `https://tiger-box.boxora.website/login`  | active |

**Box IDs:**
- Iron Box: `beef0001-0000-4000-8000-000000000000`
- Wolf Box: `beef0002-0000-4000-8000-000000000000`
- Tiger Box: `beef0003-0000-4000-8000-000000000000`

---

## 4. Usuarios por Box

> **Password para todos los usuarios de box:** `Seed@2024!`

### 🟦 Iron Box (`iron-box`)

| Nombre       | Rol           | Email                        |
|--------------|---------------|------------------------------|
| Admin 1      | `admin`       | `admin1@iron-box.seed`       |
| Admin 2      | `admin`       | `admin2@iron-box.seed`       |
| Admin 3      | `admin`       | `admin3@iron-box.seed`       |
| Coach 1      | `coach`       | `coach1@iron-box.seed`       |
| Coach 2      | `coach`       | `coach2@iron-box.seed`       |
| Coach 3      | `coach`       | `coach3@iron-box.seed`       |
| Athlete 1    | `athlete`     | `athlete1@iron-box.seed`     |
| Athlete 2    | `athlete`     | `athlete2@iron-box.seed`     |
| Athlete 3    | `athlete`     | `athlete3@iron-box.seed`     |
| Reception 1  | `receptionist`| `reception1@iron-box.seed`   |
| Reception 2  | `receptionist`| `reception2@iron-box.seed`   |
| Reception 3  | `receptionist`| `reception3@iron-box.seed`   |

---

### 🟩 Wolf Box (`wolf-box`)

| Nombre       | Rol           | Email                        |
|--------------|---------------|------------------------------|
| Admin 1      | `admin`       | `admin1@wolf-box.seed`       |
| Admin 2      | `admin`       | `admin2@wolf-box.seed`       |
| Admin 3      | `admin`       | `admin3@wolf-box.seed`       |
| Coach 1      | `coach`       | `coach1@wolf-box.seed`       |
| Coach 2      | `coach`       | `coach2@wolf-box.seed`       |
| Coach 3      | `coach`       | `coach3@wolf-box.seed`       |
| Athlete 1    | `athlete`     | `athlete1@wolf-box.seed`     |
| Athlete 2    | `athlete`     | `athlete2@wolf-box.seed`     |
| Athlete 3    | `athlete`     | `athlete3@wolf-box.seed`     |
| Reception 1  | `receptionist`| `reception1@wolf-box.seed`   |
| Reception 2  | `receptionist`| `reception2@wolf-box.seed`   |
| Reception 3  | `receptionist`| `reception3@wolf-box.seed`   |

---

### 🟥 Tiger Box (`tiger-box`)

| Nombre       | Rol           | Email                        |
|--------------|---------------|------------------------------|
| Admin 1      | `admin`       | `admin1@tiger-box.seed`      |
| Admin 2      | `admin`       | `admin2@tiger-box.seed`      |
| Admin 3      | `admin`       | `admin3@tiger-box.seed`      |
| Coach 1      | `coach`       | `coach1@tiger-box.seed`      |
| Coach 2      | `coach`       | `coach2@tiger-box.seed`      |
| Coach 3      | `coach`       | `coach3@tiger-box.seed`      |
| Athlete 1    | `athlete`     | `athlete1@tiger-box.seed`    |
| Athlete 2    | `athlete`     | `athlete2@tiger-box.seed`    |
| Athlete 3    | `athlete`     | `athlete3@tiger-box.seed`    |
| Reception 1  | `receptionist`| `reception1@tiger-box.seed`  |
| Reception 2  | `receptionist`| `reception2@tiger-box.seed`  |
| Reception 3  | `receptionist`| `reception3@tiger-box.seed`  |

---

## 5. Resumen de IDs (UUIDs)

### Auth IDs por patrón

Los auth UUIDs siguen el patrón: `{box}{role}{n}00000-0000-4000-8000-000000000000`

| Código | Significado |
|--------|-------------|
| Box: `1` | Iron Box |
| Box: `2` | Wolf Box |
| Box: `3` | Tiger Box |
| Role: `a` | admin |
| Role: `b` | coach |
| Role: `c` | athlete |
| Role: `d` | receptionist |
| `n` | número de usuario (1, 2 o 3) |

**Ejemplos:**
- `1a100000-0000-4000-8000-000000000000` → Iron Box, Admin 1 (auth)
- `1a100000-0000-4001-8000-000000000000` → Iron Box, Admin 1 (profile)
- `3d300000-0000-4000-8000-000000000000` → Tiger Box, Reception 3 (auth)

---

## 6. SQL para re-crear (idempotente)

El seed se puede volver a ejecutar sin errores gracias a `ON CONFLICT (id) DO NOTHING`.

Archivo de referencia: `scripts/seed_dev_data.sql` *(pendiente de crear si se necesita versionar)*

---

## 7. Notas

- Todos los usuarios tienen `email_confirmed_at = now()` — no requieren verificación de email.
- El usuario root tiene `box_id = NULL` — usado para acceso multi-tenant en el admin panel.
- Password del root: `Root@2024!` | Password de usuarios de box: `Seed@2024!`
- Estos datos son **solo para desarrollo/QA**. No usar en producción.

---

## Revision History

| Version | Date       | Author | Change        |
|---------|------------|--------|---------------|
| 0.1     | 2026-03-11 | Claude | Initial seed  |
