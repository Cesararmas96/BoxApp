# Feature Specification: FormBuilder Drawer — Restaurar posicionamiento lateral derecho

**Feature ID**: FEAT-007
**Date**: 2026-03-30
**Author**: Cesar Armas
**Status**: approved
**Target version**: migration/svelte-5

---

## 1. Motivation & Business Requirements

### Problem Statement

Tras la migración a Svelte 5 con flowbite-svelte **v1.31.0**, el componente
`FormBuilderDrawer` dejó de posicionarse como un panel lateral derecho. En lugar de
deslizarse desde el borde derecho cubriendo todo el alto de la pantalla, aparece centrado
en el viewport.

**Causa raíz:** flowbite-svelte v1.31 reemplazó el `<div>` del Drawer por un `<dialog>`
HTML nativo. Con `modal={false}`, el Dialog invoca `dlg.show()` (modo no-modal), cuyo
posicionamiento lo controla el UA stylesheet del navegador —centrado en pantalla— en lugar
de respetar las clases Tailwind `fixed inset-0`. El comportamiento es inconsistente entre
Chrome, Firefox y Safari.

Este bug afecta a todos los usuarios que interactúen con formularios vía AgGrid, ManageBotsView
o Dashboard, haciendo el panel inutilizable en su posición actual.

### Goals

- Restaurar el panel lateral derecho con el mismo aspecto visual que tenía en `main`.
- Mantener la animación fly desde la derecha (320px, 200ms, sineIn).
- Incluir overlay semitransparente detrás del panel.
- Bloquear el scroll del body mientras el drawer está abierto (`overflow-hidden`).
- No modificar stores, ni la interfaz pública del componente, ni sus consumers.
- Compatible con Dark Mode / Light Mode y breakpoints responsive (350px / 600px).

### Non-Goals (explicitly out of scope)

- No se actualizará flowbite-svelte a una versión superior en este feature.
- No se migrarán otros drawers del proyecto (Drawer.svelte genérico, ChatDrawer, etc.).
- No se implementará lógica de snap/drag para el panel lateral.
- No se añadirán pruebas end-to-end de Capacitor (se deja como deuda técnica con `TODO`).

---

## 2. Architectural Design

### Overview

Se reemplaza el componente `<Drawer>` de flowbite-svelte dentro de `FormBuilderDrawer.svelte`
por un par de `<div>` nativos controlados con `{#if !$hideFormBuilderDrawer}`:

1. **Overlay**: `div` con `fixed inset-0 bg-gray-900/50 z-40` + `transition:fade`.
2. **Panel**: `div` con `fixed top-0 right-0 h-full z-50 bg-white dark:bg-gray-800` +
   `transition:fly` (idénticos parámetros que antes).

El store `$hideFormBuilderDrawer` pasa de ser usado como `bind:hidden` a controlar el
bloque `{#if}`. Todo el contenido interno del drawer (header sticky, `<Form>`, footer
sticky) permanece exactamente igual.

Un `$effect` en el componente añade/quita `overflow-hidden` al `<body>` para bloquear el
scroll de fondo mientras el drawer esté visible.

Este es el mismo patrón que ya usa el commit `a8390786` para el widget MapStore.

### Component Diagram

```
+layout.svelte
  └── <WidgetFormBuilderDrawer />
          │
          ├── {#if !$hideFormBuilderDrawer}
          │       ├── <div overlay>  (fade, z-40)
          │       └── <div panel>   (fly x:320, z-50)
          │               ├── Header sticky (título, botón cerrar)
          │               ├── <Form {schema}> con slots hidden
          │               └── Footer sticky (botones save/update)
          │
          └── [stores] hideFormBuilderDrawer
                        selectedFormBuilderWidget
                        selectedFormBuilderRecord
```

### Integration Points

| Existing Component | Integration Type | Notes |
|---|---|---|
| [src/lib/components/widgets/FormBuilderDrawer.svelte](src/lib/components/widgets/FormBuilderDrawer.svelte) | modifies | Único archivo cambiado. Solo el wrapper de layout. |
| [src/routes/+layout.svelte](src/routes/+layout.svelte) | no change | Sigue montando `<WidgetFormBuilderDrawer />` igual |
| `$lib/stores/widgets` — `hideFormBuilderDrawer` | no change | Store booleano writable, interfaz pública sin cambio |
| `flowbite-svelte` `Drawer` import | removes | Se elimina del import del componente |
| [src/lib/components/layouts/Drawer.svelte](src/lib/components/layouts/Drawer.svelte) | reference | Patrón CSS `fixed` como referencia |

### Data Models

No aplica — no hay cambios de datos o stores.

### New Public Interfaces

No aplica — la interfaz pública del componente (props, stores) permanece idéntica.

---

## 3. Module Breakdown

### Módulo 1: FormBuilderDrawer — reemplazo del wrapper de layout

- **Path**: `src/lib/components/widgets/FormBuilderDrawer.svelte`
- **Responsibility**: Sustituir el `<Drawer flowbite>` por dos `<div>` nativos (overlay + panel)
  con transiciones de Svelte. Agregar `$effect` para controlar `overflow-hidden` en `<body>`.
- **Depends on**: stores existentes (`hideFormBuilderDrawer`, `selectedFormBuilderWidget`,
  `selectedFormBuilderRecord`), `svelte/transition` (fly, fade), `svelte/easing` (sineIn).

**Cambios específicos en el template:**
1. Eliminar `import { Drawer } from 'flowbite-svelte'` y agregar `import { fly, fade } from 'svelte/transition'`.
2. Agregar `import { browser } from '$app/environment'` para el `$effect` del body.
3. Agregar `$effect` que añade/quita `document.body.classList.toggle('overflow-hidden', !$hideFormBuilderDrawer)`.
4. Reemplazar `<Drawer ...>` por:
   - `{#if !$hideFormBuilderDrawer}` como bloque de control.
   - `<div>` overlay con `transition:fade` + clases `fixed inset-0 z-40 bg-gray-900/50`.
   - `<div>` panel con `transition:fly={transitionParams}` + clases `fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800` + clases responsive de ancho (`w-[350px]` / `sm:w-[600px]`).
5. Mover todo el contenido interno (header, form, footer) dentro del `<div>` panel, sin cambio alguno.

---

## 4. Test Specification

### Verificación manual (no hay suite de tests unitarios para componentes Svelte en este proyecto)

| Check | Cómo verificarlo |
|---|---|
| Panel aparece desde la derecha | Abrir cualquier widget AgGrid → clic "Editar" → drawer entra desde el borde derecho |
| Panel cubre 100% del alto | Inspeccionar elemento: `height: 100vh` o `h-full` aplicado |
| Overlay semitransparente visible | Fondo oscurecido detrás del panel al abrirse |
| Scroll del body bloqueado | Con drawer abierto, intentar scroll: la página no se mueve |
| Animación fly entrada/salida | Apertura y cierre con transición fluida de 200ms desde/hacia la derecha |
| Botón X cierra el drawer | Clic en botón X → panel sale con animación, store reseteado |
| Dark mode | Activar dark mode → panel con fondo `bg-gray-800`, bordes `border-gray-700` |
| Tamaño lg | Abrir FormBuilder con `size='lg'` → panel 600px en sm+ |
| Formulario funcional | Editar y guardar un registro → request enviado correctamente |
| Layout.svelte sin cambio | No hay regresión en otros componentes del layout |

### Edge Cases a verificar manualmente

| Caso | Comportamiento esperado |
|---|---|
| Abrir/cerrar rápido (doble clic) | Transición se cancela limpiamente, sin estado inconsistente |
| Resize de ventana con drawer abierto | Panel se mantiene en `right-0 top-0 h-full` |
| Mobile (< 350px de ancho) | Panel ocupa ancho fijo de 350px con scroll horizontal posible (mismo que `main`) |

---

## 5. Acceptance Criteria

> Este feature está completo cuando TODOS los siguientes criterios son verdaderos:

- [ ] El `FormBuilderDrawer` aparece como panel lateral desde el borde **derecho** de la pantalla.
- [ ] El panel cubre el **100% del alto** del viewport (`h-full`).
- [ ] Existe un **overlay semitransparente** (`bg-gray-900/50`) detrás del panel al abrirse.
- [ ] El **scroll del body queda bloqueado** mientras el drawer está abierto.
- [ ] La **animación fly** (x: 320, 200ms, sineIn) funciona en entrada y salida.
- [ ] El botón **X cierra correctamente** el drawer y resetea el estado interno.
- [ ] El componente funciona en **Light Mode y Dark Mode**.
- [ ] El tamaño **lg (600px)** se aplica correctamente cuando `formBuilderDrawerSize` = `'lg'`.
- [ ] Los **formularios funcionan** (carga de schema, submit de save/update).
- [ ] No hay cambios ni regresiones en `+layout.svelte`, los stores, ni los consumers
      (AgGrid, ManageBotsView, Dashboard).
- [ ] El import de `Drawer` de flowbite-svelte ha sido **eliminado** del componente.

---

## 6. Implementation Notes & Constraints

### Patterns to Follow

- **Patrón `div + fly`**: Igual al commit `a8390786` (MapStore). Ver referencia en
  [src/lib/components/layouts/Drawer.svelte:188-204](src/lib/components/layouts/Drawer.svelte#L188-L204).
- **`$effect` con guard `browser`**: Usar `import { browser } from '$app/environment'`
  para guardar el `$effect` que toca `document.body` en SSR safety.
- **Svelte 5 runes**: El componente ya usa runes correctamente. No introducir nueva
  sintaxis Svelte 4 (`$:`, `on:event`).
- **Tailwind only**: No agregar CSS scoped ni `<style>` blocks nuevos si Tailwind lo cubre.

### Known Risks / Gotchas

- **`transitionParams` apunta a `x: 320`**: Este valor corresponde al ancho del drawer
  (350px con padding). Si el ancho cambia, ajustar el valor `x`.
- **`overflow-hidden` en body**: En Capacitor/WebView, bloquear el scroll del body puede
  causar problemas en algunas versiones de iOS WebKit. Si se detecta un problema, el
  `$effect` puede condicionarse con `!isNativeApp()`.
  `// TODO: (Agent) verificar comportamiento de overflow-hidden en Capacitor iOS WebKit`
- **`{#if}` vs visibilidad CSS**: Al usar `{#if}`, el componente se desmonta/remonta en
  cada apertura. Esto es deseable (resetea estado) pero implica que el `$effect` y
  `onMount` se re-ejecutan. El comportamiento es correcto porque `close()` ya resetea
  el estado, y `getDataModel` se dispara desde el `$effect` de stores.
- **Capacitor/Android**: No verificado post-migración. Se deja como deuda técnica.
  `// TODO: (Agent) verificar posicionamiento del FormBuilderDrawer en Capacitor Android WebView`

### External Dependencies

| Package | Version | Reason |
|---|---|---|
| `svelte/transition` | built-in (Svelte ^5) | `fly` y `fade` para animaciones del panel y overlay |
| `svelte/easing` | built-in (Svelte ^5) | `sineIn` para curva de animación |
| `$app/environment` | built-in (SvelteKit) | `browser` guard para el `$effect` de body scroll |
| `tailwindcss` | ya instalado | Clases de posicionamiento y visual del panel |

**Dependencia eliminada:**
| Package | Motivo |
|---|---|
| `flowbite-svelte` `Drawer` | Reemplazado por `div` nativo — bug de posicionamiento con `<dialog>.show()` |

---

## 7. Open Questions

- [x] ¿Se debe agregar `overflow-hidden` al `<body>` cuando el drawer está abierto? — **Resuelto: SÍ**, se aplica via `$effect`.
- [x] ¿Se quiere overlay/backdrop semitransparente? — **Resuelto: SÍ**, `bg-gray-900/50` con `transition:fade`.
- [ ] ¿El comportamiento en Capacitor/Android ha sido verificado post-migración? — *Owner: QA* — **Sin verificar**. Dejar `TODO` en código.

---

## Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-03-30 | Agent | Initial draft desde brainstorm FEAT-007 |
