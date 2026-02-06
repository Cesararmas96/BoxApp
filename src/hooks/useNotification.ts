import { useState, useCallback } from 'react';
import { NotificationType } from '@/components/ui/toast-custom';

export const useNotification = () => {
    const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant?: 'default' | 'destructive';
        icon?: 'default' | 'destructive' | 'warning';
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { }
    });

    const showNotification = useCallback((type: NotificationType, message: string) => {
        setNotification({ type, message });
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(null);
    }, []);

    const showConfirm = useCallback((params: {
        title: string;
        description: string;
        onConfirm: () => void;
        variant?: 'default' | 'destructive';
        icon?: 'default' | 'destructive' | 'warning';
    }) => {
        setConfirmState({
            isOpen: true,
            ...params
        });
    }, []);

    const hideConfirm = useCallback(() => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        notification,
        showNotification,
        hideNotification,
        confirmState,
        showConfirm,
        hideConfirm
    };
};
