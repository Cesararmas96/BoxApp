# Brainstorm: FormBuilder Drawer — Restaurar posicionamiento lateral derecho

**Date**: 2026-03-30
**Author**: Agent
**Status**: exploration
**Recommended Option**: B

---

## Problem Statement

El `FormBuilderDrawer` dejó de posicionarse correctamente como un panel lateral derecho
tras la migración a Svelte 5 con flowbite-svelte **v1.31.0**.

**Causa raíz confirmada:** flowbite-svelte v1.31 reemplazó la implementación interna del
`Drawer` de Svelte 4 (un `<div>` con `position: fixed`) por el elemento HTML nativo
`<dialog>`. Cuando se usa `modal={false}`, el Dialog llama `dlg.show()` en lugar de
`dlg.showModal()`. El `<dialog>` abierto con `.show()` se posiciona en el flujo del
documento (centrado en la pantalla) y, aunque el CSS agrega `fixed inset-0`, el
comportamiento nativo del `<dialog>` en modo no-modal no aplica correctamente el
posicionamiento `fixed` relativo al viewport, resultando en el drawer centrado o en una
posición inesperada.

**Quién es afectado:**
- Usuarios finales que usan el FormBuilder desde cualquier widget con AgGrid.
- También afecta a `ManageBotsView.svelte` y `Dashboard.svelte` que abren el mismo drawer.

---

## Constraints & Requirements

- Debe verse y comportarse **exactamente como en `main`**: panel lateral deslizante desde
  la derecha, cubriendo el alto completo de la pantalla.
- No debe romper el `bind:hidden` controlado por el store `hideFormBuilderDrawer`.
- La animación de entrada/salida (fly desde la derecha) debe mantenerse.
- Compatible con dark mode y responsive (350px base / 600px lg).
- No se deben modificar los stores ni las referencias externas al componente.
- No se debe actualizar flowbite-svelte a una versión superior sin autorización previa,
  ya que eso puede romper otros componentes migrados.
- El `layouts/Drawer.svelte` genérico ya usa un workaround (CSS explícito en `<style>`)
  para forzar `fixed bottom-0` en drawers de tipo `bottom`. Ese patrón es la referencia.

---

## Options Explored

### Option A: Patch de CSS con `!important` sobre el `<dialog>` nativo

Agregar estilos globales o scoped que fuercen al elemento `<dialog>` generado por
flowbite-svelte v1.31 a comportarse como `position: fixed; top: 0; right: 0; height: 100%`
usando selectores CSS de alta especificidad o `!important`.

✅ **Pros:**
- No requiere cambiar la lógica del componente.
- Mínimo cambio de superficie.

❌ **Cons:**
- CSS de alta especificidad es frágil y difícil de mantener.
- Puede romperse con actualizaciones de flowbite-svelte.
- No resuelve el problema de raíz: el `<dialog>.show()` centra por defecto en algunos
  navegadores y el comportamiento no es consistente cross-browser.
- El `<dialog>` nativo con `.show()` tiene una posición calculada por el UA stylesheet
  que puede variar entre Chrome, Firefox y Safari.

📊 **Effort:** Low

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `flowbite-svelte@1.31.0` | UI drawer existente | Mantener, solo parchear CSS |

🔗 **Existing Code to Reuse:**
- [src/lib/components/widgets/FormBuilderDrawer.svelte](src/lib/components/widgets/FormBuilderDrawer.svelte) — agregar bloque `<style>`

---

### Option B: Reemplazar `<Drawer flowbite>` por un `<div>` nativo + transición `fly` de Svelte

Eliminar la dependencia del `Drawer` de flowbite-svelte en `FormBuilderDrawer.svelte` y
reemplazarlo por un `<div>` con clases Tailwind de posicionamiento `fixed` + la transición
`fly` de Svelte directamente. Este es exactamente el mismo patrón que ya aplicó el commit
`a8390786` para el `MapStore` widget.

El div se controla con `{#if !$hideFormBuilderDrawer}` y usa `transition:fly` con los
parámetros existentes (`x: 320, duration: 200, easing: sineIn`).

✅ **Pros:**
- Elimina completamente la dependencia del bug en flowbite-svelte v1.31.
- Posicionamiento 100% predecible: `fixed top-0 right-0 h-full` con Tailwind.
- El mismo patrón ya funciona en producción (MapStore, generic Drawer con `<style>` fijo).
- La lógica de `bind:hidden` del store se reemplaza por `{#if !$hideFormBuilderDrawer}`,
  sin necesidad de cambiar los stores ni los consumers.
- La animación `fly` de Svelte funciona igual o mejor que la de flowbite.
- Dark mode: ya está implementado con las clases `dark:bg-gray-800` existentes.
- Sin dependencias nuevas.

❌ **Cons:**
- Elimina la prop `activateClickOutside` (pero ya está `false` de todos modos).
- Se pierde el backdrop automático de flowbite (pero `modal={false}` ya lo desactivaba).
- Ligeramente más código HTML que un componente wrapper.

📊 **Effort:** Low

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `svelte/transition` (built-in) | `fly` animation | Ya importado en el archivo |
| `svelte/easing` (built-in) | `sineIn` easing | Ya importado en el archivo |
| `tailwindcss` (ya instalado) | Clases de posicionamiento | `fixed top-0 right-0 h-full z-50` |

🔗 **Existing Code to Reuse:**
- [src/lib/components/widgets/FormBuilderDrawer.svelte](src/lib/components/widgets/FormBuilderDrawer.svelte) — reemplazar solo la capa `<Drawer>` manteniendo todo el contenido interno intacto
- [src/lib/components/layouts/Drawer.svelte:188-204](src/lib/components/layouts/Drawer.svelte#L188-L204) — el `<style>` con `position: fixed` como referencia del patrón
- Commit `a8390786` — precedente directo: MapStore también reemplazó Drawer de flowbite por `div + fly`

---

### Option C: Downgrade a una versión anterior de flowbite-svelte compatible con Svelte 5

Usar flowbite-svelte en una versión que aún use `<div>` en lugar de `<dialog>` para el
Drawer, o buscar un fork/patch de la librería que corrija el bug.

✅ **Pros:**
- Solución sistémica: arreglaría todos los drawers que usen flowbite.

❌ **Cons:**
- Flowbite-svelte < 1.x no soporta Svelte 5 (incompatible con runes).
- La v1.31 es la primera versión estable con soporte Svelte 5; no hay versión intermedia.
- Un downgrade rompe el código ya migrado a Svelte 5 en todo el proyecto.
- Mantener un fork de una librería UI es carga de mantenimiento alta.
- La v1.31 ya tiene el `<dialog>` como diseño intencional, no es un bug que vayan a
  revertir; la solución correcta del proyecto es no depender de ella para posicionamiento.

📊 **Effort:** High

📦 **Libraries / Tools:**
| Package | Purpose | Notes |
|---|---|---|
| `flowbite-svelte` | UI library | No hay versión intermedia válida para Svelte 5 |

🔗 **Existing Code to Reuse:**
- N/A

---

## Recommendation

**Option B** es recomendada porque:

1. **Raíz del problema**: El `<dialog>` nativo con `.show()` (modo no-modal) no garantiza
   `fixed` positioning cross-browser. El workaround de CSS (Option A) es inestable.
2. **Precedente en el proyecto**: El commit `a8390786` ya tomó exactamente esta decisión
   para el MapStore, demostrando que el equipo reconoce que el Drawer de flowbite v1.31
   no funciona en todos los casos de uso.
3. **Mínimo cambio real**: Solo se cambia la capa de layout (el elemento contenedor).
   Todo el contenido interno del drawer —header, formulario, footer, lógica— se mantiene
   exactamente igual.
4. **Control total**: `div + fly` es predecible, testeable y no depende de comportamiento
   no estándar del navegador.
5. **Esfuerzo bajo**: Cambio quirúrgico de ~15 líneas de template HTML.

Lo que se sacrifica: el componente `<Drawer>` de flowbite ya no se usa aquí, pero dado
que ya no funciona correctamente, esto no es una pérdida real.

---

## Feature Description

### User-Facing Behavior

- Al hacer clic en "Editar" o "Nuevo" en un widget AgGrid (o cualquier trigger que active
  `$hideFormBuilderDrawer = false`), el panel aparece deslizándose desde el borde derecho
  de la pantalla.
- El panel cubre el 100% del alto de la ventana y tiene ancho fijo (350px base, 600px lg).
- Un overlay semitransparente oscurece el contenido detrás del panel.
- El usuario puede cerrar el panel solo con el botón "X" en el header (sin poder hacer
  clic fuera).
- La animación de entrada y salida es la misma que en `main`: fly desde la derecha
  (320px, 200ms, sineIn).
- Dark Mode y Light Mode funcionan con las mismas clases Tailwind existentes.

### Internal Behavior

1. El store `$hideFormBuilderDrawer` controla la visibilidad: `true` = oculto, `false` = visible.
2. El bloque `{#if !$hideFormBuilderDrawer}` monta/desmonta el panel con la transición.
3. Al montar, el overlay y el panel aparecen con `transition:fly` desde `x: 320`.
4. El z-index del panel (`z-50`) garantiza que esté por encima de todos los widgets.
5. La función `close()` sigue siendo idéntica: resetea stores y pone `$hideFormBuilderDrawer = true`.
6. Todo el contenido interno (header sticky, form, footer sticky) se mantiene sin cambios.

### Edge Cases & Error Handling

- **Scroll del body cuando el drawer está abierto**: El overlay cubre el contenido, pero
  el body puede seguir siendo scrollable. Se puede agregar `overflow-hidden` al body
  mediante un `$effect`, aunque esto es opcional y fuera del scope mínimo.
- **Mobile/Capacitor**: El panel con `fixed right-0 top-0 h-full` funciona en WebView
  igual que en desktop. El ancho de 350px ocupa la mayoría de la pantalla en mobile, lo
  cual es el comportamiento esperado (mismo que en `main`).
- **Múltiple apertura rápida**: El `{#if}` desmonta y remonta el componente, lo que
  garantiza que el estado interno (schema, primaryKey, etc.) se resetea correctamente —
  aunque `close()` ya hace ese reset explícitamente.
- **Transición incompleta + cierre**: Si el usuario cierra el drawer mientras la animación
  de entrada aún corre, Svelte cancela la transición entrante y ejecuta la saliente. No
  hay estado inconsistente.

---

## Capabilities

### New Capabilities
- `formbuilder-drawer-fixed-position`: Panel lateral derecho con posicionamiento `fixed`
  nativo via Tailwind, sin depender del `<Drawer>` de flowbite-svelte.

### Modified Capabilities
- `formbuilder-drawer`: El componente existente mantiene su interfaz pública (stores,
  props) pero cambia su implementación de layout interno.

---

## Impact & Integration

| Affected Component | Impact Type | Notes |
|---|---|---|
| [src/lib/components/widgets/FormBuilderDrawer.svelte](src/lib/components/widgets/FormBuilderDrawer.svelte) | modifies | Cambiar solo el wrapper `<Drawer>` por `<div>` con `transition:fly` |
| [src/routes/+layout.svelte](src/routes/+layout.svelte) | no change | `<WidgetFormBuilderDrawer />` sigue igual |
| `flowbite-svelte@1.31.0` | removes dependency | Se elimina el `import { Drawer } from 'flowbite-svelte'` del componente |
| `$lib/stores/widgets` (`hideFormBuilderDrawer`) | no change | Store permanece idéntico |
| `AgGrid.svelte`, `ManageBotsView.svelte`, `Dashboard.svelte` | no change | Consumers sin cambio |

---

## Open Questions

- [ ] ¿Se debe agregar `overflow-hidden` al `<body>` cuando el drawer está abierto? — *Owner: dev*  dame la opcion que sea conveniente 
- [ ] ¿Se quiere un overlay/backdrop semitransparente o el comportamiento de `main` era sin overlay? — *Owner: dev/diseño*   era con overlay
- [ ] ¿El comportamiento en Capacitor/Android se ha verificado después de la migración? — *Owner: QA* no tengo idea para capacitor
