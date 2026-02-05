/**
 * Converts a hex color string to HSL values used by Tailwind CSS variables.
 * Format: "H S% L%" (without the hsl() wrapper)
 */
export const hexToHSL = (hex: string): string => {
    // Remove the hash if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    return `${hDeg} ${sPct}% ${lPct}%`;
};

/**
 * Converts HSL values (from CSS variable) back to Hex for the color picker.
 */
export const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Simple parser for the "H S% L%" string format.
 */
export const parseHSLString = (hslStr: string): { h: number, s: number, l: number } => {
    const parts = hslStr.split(' ');
    return {
        h: parseInt(parts[0]),
        s: parseInt(parts[1].replace('%', '')),
        l: parseInt(parts[2].replace('%', ''))
    };
};
