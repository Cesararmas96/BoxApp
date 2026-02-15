import React from 'react';
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogDescription,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
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
        default: <HelpCircle className="h-8 w-8 text-primary" />,
        destructive: <Trash2 className="h-8 w-8 text-destructive" />,
        warning: <AlertCircle className="h-8 w-8 text-amber-500" />
    };

    return (
        <ResponsiveDialog open={isOpen} onOpenChange={onClose}>
            <ResponsiveDialogContent className="sm:max-w-[400px]">
                <ResponsiveDialogHeader className="pt-2 flex flex-col items-center gap-4 text-center">
                    <div className={cn(
                        "p-3 rounded-full bg-muted",
                        variant === 'destructive' ? "bg-destructive/10" : "bg-primary/10"
                    )}>
                        {icons[icon]}
                    </div>
                    <div className="space-y-2">
                        <ResponsiveDialogTitle className="text-lg font-semibold text-foreground">
                            {title}
                        </ResponsiveDialogTitle>
                        <ResponsiveDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                            {description}
                        </ResponsiveDialogDescription>
                    </div>
                </ResponsiveDialogHeader>

                <ResponsiveDialogFooter className="mt-4 flex flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        {cancelText || t('common.cancel')}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1"
                    >
                        {confirmText || t('common.confirm')}
                    </Button>
                </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
};
