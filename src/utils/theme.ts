export type BoxTheme = {
    primary: string;
    secondary: string;
    logo: string;
    boxName: string;
};

export const defaultTheme: BoxTheme = {
    primary: '#ca1f1f',
    secondary: '#1a1a1a',
    logo: '/crossfit_hero_background_1770124478080.png',
    boxName: 'CrossFit Affiliate',
};

export function applyTheme(theme: BoxTheme) {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    // Additional dynamic properties can be added here
}
