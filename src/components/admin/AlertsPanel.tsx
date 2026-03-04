import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, XCircle, Info, CheckCircle2, ArrowRight } from 'lucide-react';

export interface AdminAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    actionLabel?: string;
    actionHref?: string;
}

export interface AlertsPanelProps {
    alerts: AdminAlert[];
    loading: boolean;
}

const ALERT_CONFIG = {
    warning: {
        Icon: AlertTriangle,
        classes: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        iconClass: 'text-amber-500',
    },
    error: {
        Icon: XCircle,
        classes: 'text-red-500 bg-red-500/10 border-red-500/20',
        iconClass: 'text-red-500',
    },
    info: {
        Icon: Info,
        classes: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        iconClass: 'text-blue-500',
    },
} as const;

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, loading }) => {
    if (loading) {
        return (
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-3/4 bg-muted rounded" />
                            <div className="h-3 w-1/2 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="rounded-2xl bg-card border border-border p-6 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                <p className="text-sm font-medium text-foreground">Todo en orden</p>
                <p className="text-xs text-muted-foreground mt-1">
                    No hay alertas operativas pendientes.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {alerts.slice(0, 5).map((alert) => {
                const { Icon, classes, iconClass } = ALERT_CONFIG[alert.type];
                return (
                    <div
                        key={alert.id}
                        className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                    >
                        <div
                            className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${classes}`}
                        >
                            <Icon className={`h-4 w-4 ${iconClass}`} />
                        </div>
                        <p className="flex-1 text-sm text-foreground">{alert.message}</p>
                        {alert.actionLabel && alert.actionHref && (
                            <Link
                                to={alert.actionHref}
                                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
                            >
                                {alert.actionLabel}
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
