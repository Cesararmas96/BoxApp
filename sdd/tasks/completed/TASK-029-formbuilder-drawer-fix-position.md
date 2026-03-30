# TASK-029: Fix FormBuilderDrawer — Reemplazar Drawer flowbite por div nativo + fly

**Feature**: formbuilder-drawer
**Spec**: `sdd/specs/formbuilder-drawer.spec.md`
**Status**: done
**Priority**: high
**Estimated effort**: S (< 2h)
**Depends-on**: none
**Assigned-to**: claude-sonnet-4-6

---

## Context

El `FormBuilderDrawer` quedó roto tras la migración a Svelte 5 + flowbite-svelte v1.31.0.
El nuevo `<Drawer>` de flowbite usa un `<dialog>` HTML nativo que con `modal={false}` llama
`dlg.show()` en lugar de `dlg.showModal()`. El UA stylesheet del navegador posiciona el
`<dialog>` centrado en pantalla, ignorando las clases Tailwind `fixed inset-0`, haciendo que
el panel aparezca centrado en lugar de pegado al borde derecho.

Esta tarea implementa el **Módulo 1** de la spec FEAT-007: sustituir el wrapper `<Drawer>`
de flowbite por dos `<div>` nativos (overlay + panel) con transiciones de Svelte, replicando
el patrón ya aplicado en commit `a8390786` para el widget MapStore.

---

## Scope

- Eliminar `import { Drawer } from 'flowbite-svelte'` del componente.
- Agregar `import { fly, fade } from 'svelte/transition'` (fly ya estaba; añadir fade).
- Agregar `import { browser } from '$app/environment'` para el guard de SSR.
- Agregar `$effect` que aplica/quita `overflow-hidden` en `document.body` al abrir/cerrar.
- Reemplazar el bloque `<Drawer ...>` por:
  - `{#if !$hideFormBuilderDrawer}` como control de visibilidad.
  - `<div>` overlay con `transition:fade` + clases `fixed inset-0 z-40 bg-gray-900/50`.
  - `<div>` panel con `transition:fly={transitionParams}` + clases de posicionamiento
    `fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden border-l border-gray-200
    bg-white dark:border-gray-700 dark:bg-gray-800` + ancho responsivo.
- Mover el contenido interno (header sticky, `<Form>`, footer sticky) dentro del `<div>` panel
  **sin cambio alguno** en el contenido.
- Agregar comentarios `TODO: (Agent)` para los dos gotchas de Capacitor.

**NOT in scope**:
- Cambios en stores (`hideFormBuilderDrawer`, `selectedFormBuilderWidget`, etc.).
- Cambios en consumers (AgGrid, ManageBotsView, Dashboard, +layout.svelte).
- Migración de otros drawers del proyecto.
- Actualización de flowbite-svelte.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/lib/components/widgets/FormBuilderDrawer.svelte` | MODIFY | Único cambio — reemplazar wrapper `<Drawer>` por `div` nativo + transiciones + $effect body scroll |

---

## Implementation Notes

### Estructura final del template (sección `<template>` del .svelte)

El bloque que actualmente comienza en `<Drawer ...>` (línea 209 del archivo actual) debe
transformarse en:

```svelte
{#if !$hideFormBuilderDrawer}
  <!-- Overlay semitransparente -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-40 bg-gray-900/50"
    role="presentation"
    aria-hidden="true"
  ></div>

  <!-- Panel lateral derecho -->
  <div
    transition:fly={transitionParams}
    class="fixed top-0 right-0 z-50 flex h-full flex-col overflow-hidden border-l
           border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800
           {size === 'lg' ? 'w-[350px] sm:w-[600px]' : 'w-[350px]'}"
  >
    <!-- Todo el contenido interno: header, form, footer — SIN CAMBIOS -->
    ...contenido actual de <Drawer>...
  </div>
{/if}
```

### $effect para overflow-hidden en body

Agregar en el bloque `<script>`, junto a los otros `$effect`:

```svelte
$effect(() => {
  if (!browser) return
  document.body.classList.toggle('overflow-hidden', !$hideFormBuilderDrawer)
  return () => {
    document.body.classList.remove('overflow-hidden')
  }
})
```

### Cambios en imports (sección `<script>`)

**Eliminar** de la línea que tiene `import { Button, Drawer, Spinner } from 'flowbite-svelte'`:
- Quitar `Drawer` del destructuring → `import { Button, Spinner } from 'flowbite-svelte'`

**Agregar** en imports:
```svelte
import { fly, fade } from 'svelte/transition'
import { browser } from '$app/environment'
```

Nota: `sineIn` de `svelte/easing` ya está importado. `fly` ya está importado también —
verificar si el import existente de `svelte/transition` solo tiene `fly`; si es así, añadir
`fade` al mismo import. Si no existe ese import aún, crearlo.

### transitionParams existente (no cambiar)

```svelte
const transitionParams = {
  x: 320,
  duration: 200,
  easing: sineIn
}
```

Este objeto se usa directamente en `transition:fly={transitionParams}`. No modificar.

### TODO comments requeridos

Agregar en el `$effect` del overflow-hidden:
```
// TODO: (Agent) verificar comportamiento de overflow-hidden en Capacitor iOS WebKit
```

Agregar cerca del div panel o en un comentario al inicio del bloque:
```
// TODO: (Agent) verificar posicionamiento del FormBuilderDrawer en Capacitor Android WebView
```

### Key Constraints

- **Solo Svelte 5 runes**: No introducir `$:` ni `on:event`.
- **Tailwind only**: No agregar bloque `<style>` nuevos.
- **Contenido interno inalterado**: Todo lo que estaba dentro del `<Drawer>` va dentro del
  `<div>` panel sin cambio. Los `{#if schema}`, `<Form>`, header, footer permanecen idénticos.
- **`sineIn`** ya importado de `svelte/easing` — no duplicar.
- **`fly`** ya importado de `svelte/transition` — solo añadir `fade` al mismo import.

### References en Codebase

- `src/lib/components/layouts/Drawer.svelte:188-204` — patrón CSS `position: fixed` de
  referencia (aunque ese usa `<style>`, aquí usamos Tailwind).
- Commit `a8390786` — precedente: MapStore reemplazó Drawer flowbite por `div + fly`.
- `src/lib/components/widgets/FormBuilderDrawer.svelte` — archivo actual, leerlo antes
  de editar.

---

## Acceptance Criteria

- [ ] `import { Drawer } from 'flowbite-svelte'` eliminado del componente.
- [ ] `import { fade } from 'svelte/transition'` presente (junto a `fly`).
- [ ] `import { browser } from '$app/environment'` presente.
- [ ] `$effect` de overflow-hidden en body implementado con cleanup.
- [ ] Overlay `div` con `fixed inset-0 z-40 bg-gray-900/50` y `transition:fade` presente.
- [ ] Panel `div` con `fixed top-0 right-0 h-full z-50` y `transition:fly={transitionParams}` presente.
- [ ] Todo el contenido interno (header, `<Form>`, footer) inalterado dentro del panel.
- [ ] `npx svelte-check --tsconfig ./tsconfig.json` sin errores nuevos.
- [ ] Verificación manual: panel aparece desde el borde derecho cubriendo 100% del alto.
- [ ] Verificación manual: overlay semitransparente visible al abrir.
- [ ] Verificación manual: scroll del body bloqueado con drawer abierto.
- [ ] Verificación manual: animación fly entrada/salida fluida.
- [ ] Verificación manual: dark mode correcto.
- [ ] Verificación manual: formulario funcional (load schema, save/update).

---

## Test Specification

No hay suite de tests unitarios para componentes Svelte en este proyecto.
La verificación es manual según la tabla de la spec FEAT-007, Sección 4.

**Checklist de verificación manual:**

```
Entorno: npm run dev -- --host  (o dev server local)

[ ] 1. Abrir un módulo con widget AgGrid
[ ] 2. Clic en "Editar" en cualquier fila
     → Drawer entra desde el BORDE DERECHO (no desde el centro)
     → Panel cubre 100% del alto de la pantalla
     → Overlay semitransparente visible detrás del panel
     → Scroll del body NO se mueve mientras el drawer está abierto

[ ] 3. Cerrar con botón X
     → Panel sale con animación hacia la derecha
     → Overlay desaparece con fade
     → Scroll del body vuelve a funcionar

[ ] 4. Abrir en dark mode
     → Fondo del panel: gris oscuro (bg-gray-800)
     → Bordes: border-gray-700

[ ] 5. Abrir con size lg
     → Panel de 600px en pantallas sm+

[ ] 6. Guardar formulario
     → Request enviado correctamente, drawer se cierra

[ ] 7. Verificar svelte-check:
     npx svelte-check --tsconfig ./tsconfig.json
     → Sin errores nuevos introducidos
```

---

## Agent Instructions

Cuando tomes esta tarea:

1. **Lee la spec** en `sdd/specs/formbuilder-drawer.spec.md` para contexto completo.
2. **Lee el archivo actual** `src/lib/components/widgets/FormBuilderDrawer.svelte` — es
   fundamental leerlo antes de editar para no perder contenido interno.
3. **Actualiza el status** en `sdd/tasks/.index.json` → `"in-progress"`.
4. **Implementa** siguiendo el scope y las notas de implementación arriba.
5. **Ejecuta** `npx svelte-check --tsconfig ./tsconfig.json` y verifica sin errores nuevos.
6. **Verificación manual** con el checklist de Test Specification.
7. **Mueve este archivo** a `sdd/tasks/completed/TASK-029-formbuilder-drawer-fix-position.md`.
8. **Actualiza el index** → `"done"`.
9. **Completa la Completion Note** abajo.

---

## Completion Note

**Completed by**: claude-sonnet-4-6
**Date**: 2026-03-30
**Notes**: Implementación completada en un solo archivo (`FormBuilderDrawer.svelte`).
- Eliminado `Drawer` del import de flowbite-svelte.
- Añadidos imports: `fly, fade` de `svelte/transition`, `browser` de `$app/environment`.
- Añadido `$effect` con guard `browser` para toggle `overflow-hidden` en body con cleanup.
- Reemplazado `<Drawer>` por `{#if !$hideFormBuilderDrawer}` con overlay (`transition:fade`) y panel (`transition:fly`).
- Todo el contenido interno (header, `<Form>`, footer) movido sin cambios al panel.
- `npx svelte-check` confirmó cero errores nuevos introducidos (los 419 errores preexistentes son todos anteriores a este cambio).
- Dos comentarios `TODO: (Agent)` agregados para deuda técnica de Capacitor.

**Deviations from spec**: none
