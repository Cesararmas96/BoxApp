---
name: svelte-fullstack-generator
description: Generates SvelteKit routes (+page.svelte, +page.server.ts) integrating Supabase server-side logic and shadcn-svelte UI components.
---

# Skill: SvelteKit Fullstack Generator

## Purpose
To automate the creation of end-to-end SvelteKit routes ensuring that database interactions happen securely on the server and the UI follows the shadcn-svelte design system.

## Instructions
1. **UI Dependency Check:** Identify required shadcn components. If missing in `$lib/components/ui`, generate the command: `npx shadcn-svelte@latest add <component_names>`.
2. **Server-Side Logic (+page.server.ts):**
   - Implement `PageServerLoad` for data fetching using `locals.supabase`.
   - Implement `Actions` for form mutations.
   - Always validate the user session using `await event.locals.getSession()`.
3. **Client-Side UI (+page.svelte):**
   - Import UI components from `$lib/components/ui`.
   - Use `export let data;` and `export let form;`.
   - Apply `use:enhance` to all forms for progressive enhancement.
4. **Type Safety:** Import types from `./$types` for local route data and actions.

## Examples
**User Input:** "Create a contact form at /contact that saves messages to Supabase."
**Agent Action:**
1. Generate command: `npx shadcn-svelte@latest add button input textarea label toast`
2. Create `src/routes/contact/+page.server.ts` with an `default` action to `insert` into the 'messages' table.
3. Create `src/routes/contact/+page.svelte` using shadcn components and SvelteKit form actions.