---
name: edge-function-dev
description: Develops and deploys Supabase Edge Functions using Deno and TypeScript for heavy backend logic.
---

# Skill: Supabase Edge Function Dev

## Purpose
To build serverless functions for tasks that shouldn't run in the SvelteKit frontend, such as processing webhooks (Stripe) or heavy image manipulation.

## Instructions
1. **Scaffolding:** Create functions in `./supabase/functions/<name>/index.ts`.
2. **Environment:** Use Deno-compatible imports (from `esm.sh` or `deno.land`).
3. **Security:** Use `Deno.env.get()` for secrets and validate the Authorization header if the function is not public.
4. **Deployment:** Generate the command: `supabase functions deploy <name> --project-ref <id>`.

## Constraints
- Do not use Node.js specific libraries; only Deno-compatible modules.
- Ensure CORS headers are handled if the function is called directly from the browser.