import { useState, useCallback } from 'react';
import { NotificationType } from '@/components/ui/toast-custom';

export const useNotification = () => {
    const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

    const showNotification = useCallback((type: NotificationType, message: string) => {
        setNotification({ type, message });
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return {
        notification,
        showNotification,
        hideNotification
    };
};
