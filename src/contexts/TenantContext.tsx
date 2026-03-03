import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getTenantSlug } from '@/utils/tenant';
import { Database } from '@/types/supabase';

type BoxRow = Database['public']['Tables']['boxes']['Row'];

interface TenantContextType {
    tenantSlug: string | null;
    tenantBox: BoxRow | null;
    isTenantSubdomain: boolean;  // true if getTenantSlug() !== null
    isSuspended: boolean;         // true if subscription_status is 'suspended' or 'cancelled'
    tenantNotFound: boolean;      // true if the slug doesn't exist in the DB
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * TenantProvider handles multi-tenant resolution at the application root.
 * It identifies the box based on the hostname (prod) or query param (dev)
 * and fetches the box configuration from Supabase before the session is loaded.
 */
export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenantBox, setTenantBox] = useState<BoxRow | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tenantNotFound, setTenantNotFound] = useState(false);

    const tenantSlug = getTenantSlug();
    const isTenantSubdomain = tenantSlug !== null;

    useEffect(() => {
        // If not on a tenant subdomain/route, nothing to fetch
        if (!tenantSlug) {
            setIsLoading(false);
            return;
        }

        const fetchBox = async () => {
            try {
                // This is an anonymous fetch. RLS should allow reading boxes by slug.
                const { data, error } = await supabase
                    .from('boxes')
                    .select('*')
                    .eq('slug', tenantSlug)
                    .single();

                if (error || !data) {
                    console.warn(`[TenantContext] Box not found for slug: ${tenantSlug}`);
                    setTenantNotFound(true);
                } else {
                    setTenantBox(data as BoxRow);
                }
            } catch (err) {
                console.error('[TenantContext] Unexpected error fetching box:', err);
                setTenantNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBox();
    }, [tenantSlug]);

    const isSuspended =
        tenantBox?.subscription_status === 'suspended' ||
        tenantBox?.subscription_status === 'cancelled';

    return (
        <TenantContext.Provider value={{
            tenantSlug,
            tenantBox,
            isTenantSubdomain,
            isSuspended,
            tenantNotFound,
            isLoading,
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const ctx = useContext(TenantContext);
    if (ctx === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return ctx;
};
