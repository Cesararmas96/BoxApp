import React from 'react';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface SubscriptionBannerProps {
    status: SubscriptionStatus;
    trialEndsAt: string | null;
}

function getDaysRemaining(trialEndsAt: string | null): number {
    if (!trialEndsAt) return 0;
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ status, trialEndsAt }) => {
    if (status === 'active') return null;

    if (status === 'trial') {
        const days = getDaysRemaining(trialEndsAt);
        const isUrgent = days <= 7;

        return (
            <div
                className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium',
                    isUrgent
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                )}
            >
                {isUrgent ? (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="hidden sm:inline">
                    {isUrgent
                        ? `⚠️ Trial vence en ${days} días`
                        : `Trial · ${days} días restantes`}
                </span>
                <span className="sm:hidden">{days}d</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300"
                    asChild
                >
                    <a href="mailto:soporte@boxora.com">Actualizar plan →</a>
                </Button>
            </div>
        );
    }

    // suspended | cancelled
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">
                {status === 'suspended'
                    ? 'Tu box está suspendido.'
                    : 'Tu suscripción fue cancelada.'}
            </span>
            <span className="sm:hidden">Box suspendido</span>
            <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
                asChild
            >
                <a href="mailto:soporte@boxora.com">Contactar soporte →</a>
            </Button>
        </div>
    );
};
