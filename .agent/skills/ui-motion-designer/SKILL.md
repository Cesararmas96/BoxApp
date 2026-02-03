---
name: ui-motion-designer
description: Implements UI transitions, animations, and micro-interactions using native Svelte features and CSS.
---

# Skill: UI Motion Designer

## Purpose
To enhance UX by adding meaningful motion that guides the user's eye, indicates state changes, or softens layout shifts, maintaining the application's premium "feel".

## Instructions
1. **Native Svelte Transitions:** Prioritize using Svelte's built-in `transition:`, `in:`, and `out:` directives over external libraries.
   - Import basics: `import { fade, fly, slide, scale } from 'svelte/transition';`
   - Use easing functions: `import { quintOut, elasticOut } from 'svelte/easing';`
2. **Contextual Use:**
   - **Page Navigation:** Apply subtle fade transitions in `+layout.svelte` with `<key>` blocks.
   - **List Items:** Use `animate:flip` for reordering lists.
   - **Modals/Dialogs:** Use `fly` with `y` axis movement and appropriate easing.
3. **Performance:** Ensure animations use CSS transform/opacity properties to avoid layout thrashing (handled automatically by Svelte transitions mostly).
4. **Reduced Motion:** Always include a media query check for `prefers-reduced-motion` to disable heavy animations for accessibility.

## Examples
**User Input:** "Make the alert toast slide in smoothly from the bottom right."
**Agent Action:** Add `in:fly={{ y: 50, x: 50, duration: 300, easing: quintOut }}` to the toast component container.

**User Input:** "Animate the list when items are deleted."
**Agent Action:** Wrap list items in a keyed each block (`{#each items as item (item.id)}`) and apply `transition:slide|local` and `animate:flip`.