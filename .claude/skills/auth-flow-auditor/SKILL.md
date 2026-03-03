---
name: auth-flow-auditor
description: Audits and generates SvelteKit middleware (hooks) and route guards for authentication.
---

# Skill: Auth Flow Auditor

## Purpose
Secures the application by managing session persistence and protecting private routes from unauthorized access.

## Instructions
1. **Middleware Check:** Ensure `src/hooks.server.ts` correctly initializes the Supabase client and calls `getSession()`.
2. **Server-Side Guards:** In protected `+page.server.ts` or `+layout.server.ts`, implement:
   `const session = await event.locals.getSession(); if (!session) throw redirect(303, '/login');`
3. **Event Locals:** Verify that `app.d.ts` correctly defines `Locals` to include `supabase` and `getSession`.

## Constraints
- Do not rely on client-side logic for security.
- Use HTTP status `303 See Other` for redirects after POST actions.