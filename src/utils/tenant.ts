const MAIN_DOMAIN = 'boxora.website';

/**
 * Checks whether the current hostname is the "main" domain
 * (i.e. not a tenant subdomain). In dev mode `localhost`
 * and `127.0.0.1` are treated as main.
 */
export function isMainDomain(): boolean {
    const host = window.location.hostname;
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === MAIN_DOMAIN ||
        host === `www.${MAIN_DOMAIN}` ||
        host === `admin.${MAIN_DOMAIN}`
    );
}

const DEV_TENANT_KEY = 'dev_tenant_slug';

/**
 * Extracts the tenant slug according to the environment:
 * - Prod: from subdomain ({slug}.boxora.website)
 * - Dev: from query param ?box=<slug> with sessionStorage fallback
 *        so the slug survives React Router navigation (no hard refresh loss).
 * Returns null if on the main domain or system subdomain.
 */
export function getTenantSlug(): string | null {
    const host = window.location.hostname;

    // Dev mode: localhost or 127.0.0.1
    if (host === 'localhost' || host === '127.0.0.1') {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('box');
        if (fromUrl) {
            // Persist so subsequent navigations (which drop the param) still resolve
            sessionStorage.setItem(DEV_TENANT_KEY, fromUrl);
            return fromUrl;
        }
        // Fallback to previously stored slug (survives SPA navigation / refresh)
        return sessionStorage.getItem(DEV_TENANT_KEY) || null;
    }

    // Prod: extract subdomain from *.boxora.website
    if (host.endsWith(`.${MAIN_DOMAIN}`)) {
        const slug = host.slice(0, host.length - MAIN_DOMAIN.length - 1);
        // Exclude system subdomains
        if (slug && slug !== 'www' && slug !== 'admin') {
            return slug;
        }
    }

    return null;
}

/**
 * Clears the dev tenant session so the next page load starts clean.
 * Call this on sign-out when in dev mode.
 */
export function clearDevTenantSlug(): void {
    sessionStorage.removeItem(DEV_TENANT_KEY);
}

/**
 * Builds the full URL for a specific box tenant.
 * - Prod: https://{slug}.boxora.website
 * - Dev: /?box={slug} (for testing without real subdomains)
 */
export function buildTenantUrl(slug: string): string {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return `/?box=${slug}`;
    }
    return `https://${slug}.${MAIN_DOMAIN}`;
}

