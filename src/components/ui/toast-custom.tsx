import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
                setTimeout(onClose, 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [type, duration, onClose]);

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
        error: <AlertCircle className="h-5 w-5 text-destructive" />,
        loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />
    };

    const colors = {
        success: "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/50",
        error: "border-destructive/20 bg-destructive/5",
        loading: "border-primary/20 bg-primary/5"
    };

    const toastContent = (
        <div className={cn(
            "fixed top-4 right-4 z-[99999] transition-all duration-300 ease-out",
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        )}>
            <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl min-w-[300px] max-w-[90vw] shadow-apple-lg",
                colors[type]
            )}>
                <div className="flex-shrink-0">{icons[type]}</div>
                <p className="flex-1 text-sm font-medium text-foreground">{message}</p>
                {type !== 'loading' && (
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="p-1 hover:bg-foreground/5 rounded-full transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>
        </div>
    );

    return createPortal(toastContent, document.body);
};
