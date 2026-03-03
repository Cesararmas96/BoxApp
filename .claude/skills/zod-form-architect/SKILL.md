---
name: zod-form-architect
description: Designs Zod validation schemas for SvelteKit forms and validates server-side ActionData.
---

# Skill: Zod Form Architect

## Purpose
Standardizes data validation to ensure that all inputs sent to Supabase are sanitized and correctly typed.

## Instructions
1. **Schema Definition:** Create a `schema.ts` file in the route folder or `$lib/schemas`.
2. **Server Validation:** Inside `+page.server.ts` actions, parse `formData` using `schema.safeParse(Object.fromEntries(formData))`.
3. **Error Handling:** If validation fails, return `fail(400, { errors: result.error.flatten() })`.
4. **Client Sync:** Use the schema to provide real-time validation feedback in the UI if requested.

## Examples
**User Input:** "Validate a sign-up form with email (required) and password (min 8 chars)."
**Agent Action:** Generate `export const signUpSchema = z.object({ email: z.string().email(), password: z.string().min(8) });`.