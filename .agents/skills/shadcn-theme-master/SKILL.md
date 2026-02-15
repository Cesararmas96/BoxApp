---
name: shadcn-theme-master
description: Manages CSS variables, Tailwind configurations, and consistent component styling for shadcn-svelte.
---

# Skill: shadcn Theme Master

## Purpose
To maintain visual consistency across the application by centralizing theme tokens and ensuring all new components adhere to the project's design system.

## Instructions
1. **Style Audit:** Before creating UI, check `src/app.css` for existing CSS variables (--primary, --radius, etc.).
2. **Tailwind Config:** Modify `tailwind.config.js` if custom animations or extended color palettes are required.
3. **Consistency:** Ensure all generated components use Tailwind utility classes that reference the theme variables instead of hardcoded hex values.
4. **Dark Mode:** Implement `sun` and `moon` icons and logic using `mode-watcher` for Svelte.

## Example
**User Input:** "Change the primary brand color to a deep emerald and update the border radius."
**Agent Action:** Update the `:root` and `.dark` selectors in `app.css` with the new HSL values.