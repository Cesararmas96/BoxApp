import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
    const { t, i18n } = useTranslation();

    // You can add custom logic here if needed, 
    // like forced language or custom translation wrappers

    return {
        t,
        i18n,
        language: i18n.language,
        changeLanguage: (lng: string) => i18n.changeLanguage(lng)
    };
};
