# Multi-Tenant Routing Design — Path-Based MVP

## Decision
**Alternativa A: Path-based routing** for the MVP phase.

## Architecture
- `boxora.website/` → redirects to `/admin` if root, otherwise `/login`
- `boxora.website/admin` → Super-admin panel (root@test.com only)
- `boxora.website/box/:slug` → Box-specific login + app

## Key Components
1. **`src/utils/tenant.ts`** — Slug resolver utility (extracts from path param)
2. **`src/pages/SuperAdmin.tsx`** — Box management dashboard
3. **`src/App.tsx`** — Route bifurcation: root users see admin, box users see app

## Migration Path to Subdomains
When revenue justifies Vercel Pro ($20/mo):
1. Change `tenant.ts` to extract slug from hostname
2. Add wildcard DNS: `*.boxora.website` → Vercel
3. ~10 lines of code change

## RLS Considerations
- Super-admin (root) bypasses box-scoped RLS via `service_role` or special check
- The `boxes` table allows `anon` SELECT for slug-based login
