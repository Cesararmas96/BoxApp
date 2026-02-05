import { createContext, useContext, useEffect, useState } from "react"
import { hexToHSL } from "@/utils/colorUtils"

type Theme = "dark" | "light" | "system"
type DesignStyle = "cyber" | "minimal" | "brutalist"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    defaultPrimary?: string
    defaultRadius?: number
    defaultStyle?: DesignStyle
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    primaryColor: string
    setPrimaryColor: (color: string) => void
    radius: number
    setRadius: (radius: number) => void
    designStyle: DesignStyle
    setDesignStyle: (style: DesignStyle) => void
    resetTheme: () => void
}

const DEFAULT_PRIMARY = "#FF3B30"
const DEFAULT_RADIUS = 0.75
const DEFAULT_STYLE = "cyber"

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    primaryColor: DEFAULT_PRIMARY,
    setPrimaryColor: () => null,
    radius: DEFAULT_RADIUS,
    setRadius: () => null,
    designStyle: DEFAULT_STYLE,
    setDesignStyle: () => null,
    resetTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    defaultPrimary = DEFAULT_PRIMARY,
    defaultRadius = DEFAULT_RADIUS,
    defaultStyle = DEFAULT_STYLE,
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [primaryColor, setPrimaryColor] = useState(
        () => localStorage.getItem("primary-color") || defaultPrimary
    )
    const [radius, setRadius] = useState(
        () => parseFloat(localStorage.getItem("ui-radius") || defaultRadius.toString())
    )
    const [designStyle, setDesignStyle] = useState<DesignStyle>(
        () => (localStorage.getItem("design-style") as DesignStyle) || defaultStyle
    )

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }
    }, [theme])

    useEffect(() => {
        const root = window.document.documentElement

        // Apply design style class
        root.classList.remove("cyber", "minimal", "brutalist")
        root.classList.add(designStyle)
        localStorage.setItem("design-style", designStyle)
    }, [designStyle])

    useEffect(() => {
        const root = window.document.documentElement

        // Apply primary color HSL to CSS variable
        const hsl = hexToHSL(primaryColor)
        root.style.setProperty('--primary', hsl)

        // Apply radius to CSS variable
        root.style.setProperty('--radius', `${radius}rem`)

        localStorage.setItem("primary-color", primaryColor)
        localStorage.setItem("ui-radius", radius.toString())
    }, [primaryColor, radius])

    const resetTheme = () => {
        setTheme(defaultTheme)
        setPrimaryColor(DEFAULT_PRIMARY)
        setRadius(DEFAULT_RADIUS)
        setDesignStyle(DEFAULT_STYLE)
        localStorage.setItem(storageKey, defaultTheme)
    }

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        primaryColor,
        setPrimaryColor,
        radius,
        setRadius,
        designStyle,
        setDesignStyle,
        resetTheme
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
