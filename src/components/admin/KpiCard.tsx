import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface KpiCardProps {
    label: string;
    value: number | string;
    delta?: number;
    icon: React.ReactNode;
    loading?: boolean;
    error?: boolean;
    unit?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
    label,
    value,
    delta,
    icon,
    loading = false,
    error = false,
    unit = '',
}) => {
    if (loading) {
        return (
            <div className="rounded-2xl bg-card border border-border p-5 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-3.5 w-28 bg-muted rounded" />
                    <div className="h-8 w-8 rounded-xl bg-muted" />
                </div>
                <div className="h-8 w-20 bg-muted rounded" />
            </div>
        );
    }

    const displayValue = error ? '—' : `${unit}${value}`;
    const hasDelta = !error && delta !== undefined && delta !== 0;
    const isPositive = (delta ?? 0) > 0;

    return (
        <div className="rounded-2xl bg-card border border-border p-5 flex flex-col gap-3 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium truncate pr-2">{label}</span>
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {icon}
                </div>
            </div>
            <div className="flex items-end gap-2">
                <span
                    className={`text-2xl font-bold tracking-tight ${
                        error ? 'text-muted-foreground' : 'text-foreground'
                    }`}
                >
                    {displayValue}
                </span>
                {hasDelta && (
                    <span
                        className={`flex items-center gap-0.5 text-xs font-semibold mb-0.5 ${
                            isPositive ? 'text-emerald-500' : 'text-red-500'
                        }`}
                    >
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(delta!).toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    );
};
