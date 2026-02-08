import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    HelpCircle,
    Trash2,
    AlertCircle
} from "lucide-react";
import { useLanguage } from '@/hooks';
import { cn } from '@/lib/utils';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    icon?: 'default' | 'destructive' | 'warning';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText,
    variant = 'default',
    icon = 'default'
}) => {
    const { t } = useLanguage();

    const icons = {
        default: <HelpCircle className="h-10 w-10 text-primary animate-pulse" />,
        destructive: <Trash2 className="h-10 w-10 text-destructive animate-bounce" />,
        warning: <AlertCircle className="h-10 w-10 text-amber-500 animate-pulse" />
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-background/95 dark:bg-zinc-950/95 border-black/5 dark:border-white/5 backdrop-blur-xl overflow-hidden rounded-[2rem] shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                <DialogHeader className="pt-6 flex flex-col items-center gap-4 text-center">
                    <div className={cn(
                        "p-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-2xl",
                        variant === 'destructive' ? "shadow-destructive/10" : "shadow-primary/10"
                    )}>
                        {icons[icon]}
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-xl font-black italic uppercase tracking-tight text-foreground dark:text-white">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed">
                            {description}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <DialogFooter className="mt-6 flex flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-12 uppercase font-black italic tracking-widest text-[10px] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                        {cancelText || t('common.cancel')}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "flex-1 rounded-xl h-12 uppercase font-black italic tracking-widest text-[10px] shadow-lg transition-all",
                            variant === 'destructive'
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                        )}
                    >
                        {confirmText || t('common.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
