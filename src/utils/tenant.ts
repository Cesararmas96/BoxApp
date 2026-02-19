/**
 * Tenant resolver utility.
 *
 * MVP: Extracts the box slug from the URL path (`/box/:slug`).
 * Future: Will extract from hostname (`slug.boxora.website`).
 *
 * Centralised here so migration to subdomain-based routing
 * requires changing only this file.
 */

const MAIN_DOMAIN = 'boxora.website';

/**
 * Checks whether the current hostname is the "main" domain
 * (i.e. not a tenant subdomain).  In dev mode `localhost`
 * and `127.0.0.1` are treated as main.
 */
export function isMainDomain(): boolean {
    const host = window.location.hostname;
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === MAIN_DOMAIN ||
        host === `www.${MAIN_DOMAIN}`
    );
}

/**
 * Extracts the tenant slug from the current URL path.
 * Expects a route like `/box/:slug/...` and returns the slug portion.
 * Returns `null` when on a non-tenant route.
 *
 * Future (subdomain mode): extract from `slug.boxora.website`.
 */
export function getTenantSlugFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/box\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

/**
 * Builds the full URL for a specific box tenant.
 *
 * MVP (path-based):  `/box/{slug}`
 * Future (subdomain): `https://{slug}.boxora.website`
 */
export function buildTenantUrl(slug: string): string {
    // MVP: path-based
    return `/box/${slug}`;

    // TODO: (Agent) Future subdomain mode:
    // const protocol = window.location.protocol;
    // return `${protocol}//${slug}.${MAIN_DOMAIN}`;
}
