import React, { createContext, useContext, useEffect, useState } from 'react';
import { hexToHSL } from '@/utils/colorUtils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    radius: number;
    setRadius: (radius: number) => void;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY = '#FF3B30';
const DEFAULT_RADIUS = 0.75;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() =>
        (localStorage.getItem('theme') as Theme) || 'system'
    );
    const [primaryColor, setPrimaryColor] = useState(() =>
        localStorage.getItem('primaryColor') || DEFAULT_PRIMARY
    );
    const [radius, setRadius] = useState(() =>
        parseFloat(localStorage.getItem('radius') || DEFAULT_RADIUS.toString())
    );

    useEffect(() => {
        const root = window.document.documentElement;

        // Theme logic
        root.classList.remove('light', 'dark');
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        // Persist
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;

        // Apply primary color
        const hsl = hexToHSL(primaryColor);
        root.style.setProperty('--primary', hsl);

        // Apply radius
        root.style.setProperty('--radius', `${radius}rem`);

        // Persist
        localStorage.setItem('primaryColor', primaryColor);
        localStorage.setItem('radius', radius.toString());
    }, [primaryColor, radius]);

    const resetTheme = () => {
        setTheme('system');
        setPrimaryColor(DEFAULT_PRIMARY);
        setRadius(DEFAULT_RADIUS);
    };

    return (
        <ThemeContext.Provider value={{
            theme, setTheme,
            primaryColor, setPrimaryColor,
            radius, setRadius,
            resetTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
