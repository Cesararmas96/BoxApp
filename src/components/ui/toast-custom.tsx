import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'loading';

interface ToastProps {
    type: NotificationType;
    message: string;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 4000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (type !== 'loading') {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for fade-out animation
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [type, duration, onClose]);

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-destructive" />,
        loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />
    };

    const colors = {
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
        error: "border-destructive/20 bg-destructive/10 text-destructive shadow-[0_0_20px_rgba(239,68,68,0.1)]",
        loading: "border-primary/20 bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
    };

    return (
        <div className={cn(
            "fixed top-6 right-6 z-[100] transition-all duration-300 ease-out",
            isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-4 opacity-0 scale-95"
        )}>
            <div className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md min-w-[320px] max-w-[90vw]",
                colors[type]
            )}>
                <div className="flex-shrink-0">{icons[type]}</div>
                <p className="flex-1 text-sm font-black uppercase italic tracking-tight">{message}</p>
                {type !== 'loading' && (
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="p-1 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X className="h-4 w-4 opacity-50" />
                    </button>
                )}
            </div>
        </div>
    );
};

// Global context/provider can be added later if needed, but for now we can use it per page or as a portal.
