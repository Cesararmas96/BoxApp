import React from 'react';
import { AlertTriangle, Mail, LogOut } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * SuspendedScreen — shown when a tenant's subscription_status is 'suspended' or 'cancelled'.
 * Rendered by App.tsx before any authenticated route, blocking all access.
 * Works whether the user is logged in or not.
 */
export const SuspendedScreen: React.FC = () => {
    const { tenantBox } = useTenant();
    const { signOut, session } = useAuth();

    const handleSignOut = async () => {
        if (session) {
            await signOut();
        }
    };

    return (
        <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4">
            <div className="max-w-sm w-full text-center space-y-6">

                {/* Logo or fallback icon */}
                {tenantBox?.logo_url ? (
                    <img
                        src={tenantBox.logo_url}
                        alt={tenantBox.name}
                        className="h-16 w-16 mx-auto rounded-2xl object-contain bg-white/10 ring-2 ring-white/10 shadow-xl"
                    />
                ) : (
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-xl">
                        <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                )}

                {/* Box name */}
                {tenantBox?.name && (
                    <p className="text-xs text-white/30 font-medium uppercase tracking-[0.2em]">
                        {tenantBox.name}
                    </p>
                )}

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Cuenta suspendida</h1>
                    <p className="text-white/50 text-sm leading-relaxed">
                        La suscripción de este box ha sido suspendida.
                        Para reactivar el acceso, contáctanos.
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.06]" />

                {/* Contact */}
                <a
                    href="mailto:soporte@boxora.website"
                    className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                    <Mail className="h-4 w-4 shrink-0" />
                    soporte@boxora.website
                </a>

                {/* Sign out — only shown if there's an active session */}
                {session && (
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full text-white/30 hover:text-white hover:bg-white/5 rounded-xl"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar sesión
                    </Button>
                )}
            </div>
        </div>
    );
};
