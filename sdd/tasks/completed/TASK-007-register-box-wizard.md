# TASK-007: Implement RegisterBox self-service wizard

**Feature**: Multi-Tenant Platform (Boxora)
**Spec**: `sdd/specs/multi-tenant-platform.spec.md` — Module 6
**Status**: in-progress
**Priority**: high
**Estimated effort**: L (4-8h)
**Depends-on**: TASK-002, TASK-003
**Assigned-to**: antigravity

---

## Context

Este es el task más visible del feature: el wizard de 2 pasos que permite a un dueño de gym registrar su box de forma autónoma, sin intervención del super-admin. El resultado es un nuevo registro en `boxes`, un nuevo usuario en `auth.users` con `role_id = 'admin'`, y una redirección al subdominio del box recién creado. Sin este flujo, el producto no puede escalar más allá de los boxes que el super-admin crea manualmente.

---

## Scope

- Crear `src/pages/RegisterBox.tsx` con un wizard de 2 pasos:
  - **Paso 1 — Tu Box**: Nombre del box, slug (auto-generado desde el nombre, editable manualmente), país.
  - **Paso 2 — Tu cuenta**: Email y contraseña para el primer admin (mínimo 8 caracteres).
- Validación en tiempo real del slug: unicidad contra la DB (debounce 500ms), formato válido (solo `[a-z0-9-]`).
- Al completar el Paso 2:
  1. Insertar el box en `boxes` (con `subscription_status = 'trial'`).
  2. Hacer `signUp` vía Supabase Auth con `user_metadata: { box_id: <nuevo-box-id>, role_id: 'admin' }`.
  3. Redirigir al usuario a `buildTenantUrl(slug)` para que acceda a su nuevo subdominio.
- Mostrar un estado de éxito antes de la redirección (3 segundos).
- Manejo de errores inline (slug ya tomado, email ya registrado, error de red).

**NOT in scope**: Email de bienvenida (out of scope por decisión del spec). Subir logo en el wizard (se hace después desde Settings). Pago/Stripe (out of scope).

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/RegisterBox.tsx` | CREATE | Wizard de 2 pasos de registro |

---

## Implementation Notes

### Estructura del wizard

```tsx
// src/pages/RegisterBox.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { buildTenantUrl } from '@/utils/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Building2, ChevronRight } from 'lucide-react';

type Step = 1 | 2;

export const RegisterBox: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Paso 1: datos del box
  const [boxName, setBoxName] = useState('');
  const [slug, setSlug] = useState('');
  const [country, setCountry] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Paso 2: cuenta del admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-generar slug desde el nombre del box
  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleBoxNameChange = (name: string) => {
    setBoxName(name);
    setSlug(autoSlug(name));
    setSlugAvailable(null);
  };

  // Validación de slug con debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!slug) { setSlugError(null); setSlugAvailable(null); return; }

    if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
      setSlugError('Solo letras minúsculas, números y guiones. Entre 3 y 50 caracteres.');
      setSlugAvailable(false);
      return;
    }

    setSlugError(null);
    setSlugChecking(true);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('boxes')
        .select('id')
        .eq('slug', slug)
        .single();
      setSlugAvailable(!data);
      setSlugChecking(false);
    }, 500);
  }, [slug]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Crear el box
      const { data: newBox, error: boxError } = await supabase
        .from('boxes')
        .insert({ name: boxName, slug, country } as any)
        .select()
        .single();

      if (boxError || !newBox) throw boxError || new Error('Error creando el box');

      // 2. Crear la cuenta del admin con box_id en metadata
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { box_id: newBox.id, role_id: 'admin' },
        },
      });

      if (signUpError) {
        // Revertir el box si el signup falla
        await supabase.from('boxes').delete().eq('id', newBox.id);
        throw signUpError;
      }

      setSuccess(true);

      // 3. Redirigir al subdominio del nuevo box
      setTimeout(() => {
        window.location.href = buildTenantUrl(slug);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Error inesperado. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return <SuccessScreen slug={slug} boxName={boxName} />;
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Registra tu Box</h1>
          <p className="text-white/40 text-sm mt-1">Paso {step} de 2</p>
        </div>

        {/* Paso 1: Datos del box */}
        {step === 1 && (
          <Step1
            boxName={boxName} onBoxNameChange={handleBoxNameChange}
            slug={slug} onSlugChange={setSlug}
            slugError={slugError} slugChecking={slugChecking} slugAvailable={slugAvailable}
            country={country} onCountryChange={setCountry}
            onNext={() => setStep(2)}
          />
        )}

        {/* Paso 2: Cuenta del admin */}
        {step === 2 && (
          <Step2
            email={email} onEmailChange={setEmail}
            password={password} onPasswordChange={setPassword}
            error={error}
            isSubmitting={isSubmitting}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}

        {/* Link al login */}
        <p className="text-center text-sm text-white/30">
          ¿Ya tienes una cuenta?{' '}
          <a href="/login" className="text-white/60 hover:text-white">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
};
```

### Implementar los sub-componentes Step1 y Step2 en el mismo archivo

`Step1` contiene: Input de nombre, Input de slug (con indicador visual de disponibilidad — verde/rojo/spinner), Input de país (select simple o text input).

`Step2` contiene: Input de email, Input de password, botón "Crear mi Box" (disabled si isSubmitting), botón "Atrás".

`SuccessScreen` contiene: Checkmark animado, "¡Tu box está listo! Redirigiendo a {slug}.boxora.website...".

### Key Constraints

- El slug se valida **en tiempo real** con debounce de 500ms para no saturar la DB.
- En caso de error en el signup (paso 2), el box creado debe **revertirse** (DELETE).
- La redirección al subdominio usa `window.location.href = buildTenantUrl(slug)` (no `navigate()`) porque es un cambio de hostname.
- No debe haber `console.log` en producción.
- La contraseña debe tener mínimo 8 caracteres (validación en frontend antes de enviar).
- El campo `country` es simple por ahora: text input libre o select básico con países de LATAM.

### References en codebase

- `src/pages/SuperAdmin.tsx` — estilo visual (dark, glassmorphism, inputs) a replicar
- `src/pages/Login.tsx` — patrón de formulario con Supabase Auth y manejo de errores
- `src/utils/tenant.ts` (TASK-002) — `buildTenantUrl` para la redirección final
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`

---

## Acceptance Criteria

- [ ] El Paso 1 muestra validación en tiempo real del slug (disponible/no disponible/formato inválido)
- [ ] El botón "Siguiente" del Paso 1 está deshabilitado si el slug no está disponible o el nombre está vacío
- [ ] El Paso 2 valida que la contraseña tiene al menos 8 caracteres antes de enviar
- [ ] Al completar exitosamente: el box aparece en `public.boxes` con `subscription_status = 'trial'`
- [ ] Al completar exitosamente: el profile del nuevo usuario tiene `box_id` asignado y `role_id = 'admin'`
- [ ] Al completar exitosamente: se muestra pantalla de éxito y se redirige a `{slug}.boxora.website` (o `/?box={slug}` en dev)
- [ ] Si el signup falla: el box es eliminado de la DB (rollback)
- [ ] Los errores se muestran inline (no `alert()`)
- [ ] `npx tsc --noEmit` pasa sin errores

---

## Test Specification

Tests manuales end-to-end:

```
1. Registro exitoso completo:
   Paso 1: nombre "CrossFit Demo 2", slug auto → "crossfit-demo-2", país "Venezuela"
   Paso 2: email "admin@crossfitdemo2.com", password "password123"
   → Box creado en DB, profile con box_id y role_id='admin', redirect a /?box=crossfit-demo-2

2. Slug ya tomado:
   Paso 1: nombre de un box existente → slug con error "ya está en uso"
   → Botón "Siguiente" deshabilitado

3. Slug inválido:
   Paso 1: escribir "Mi Box!" → slug "mi-box", después borrar y escribir "AB" → error de longitud
   → Indicador rojo visible

4. Signup con email ya registrado:
   Paso 2: usar email ya existente → error inline "Email ya está registrado"
   → El box es eliminado de la DB (verificar con SQL)

5. Contraseña corta:
   Paso 2: password "abc" → error "Mínimo 8 caracteres" antes de enviar
```

---

## Agent Instructions

1. Verificar TASK-002 y TASK-003 completados
2. Leer `src/pages/Login.tsx` y `src/pages/SuperAdmin.tsx` para el estilo
3. Implementar el wizard completo con los sub-componentes
4. Probar los 5 escenarios manuales
5. Verificar en Supabase Dashboard que los datos se crean correctamente
6. Ejecutar `npx tsc --noEmit`
7. Mover a `tasks/completed/` y actualizar índice

---

## Completion Note

*(Agent fills this in when done)*

**Completed by**: antigravity
**Date**: 2026-03-03
**Notes**: Se implementó el wizard de registro de boxes de 2 pasos en `src/pages/RegisterBox.tsx`. El flujo incluye validación de slug en tiempo real, registro del box en Supabase, signup del usuario administrador con inyección de `box_id` en metadata, y redirección automática al nuevo subdominio/tenant. Se incluyó lógica de rollback para eliminar el box si el registro del usuario falla.
**Deviations from spec**: none
