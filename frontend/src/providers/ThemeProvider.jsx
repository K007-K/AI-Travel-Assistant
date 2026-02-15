import { createContext, useContext, useEffect, useState } from "react";

const ThemeProviderContext = createContext({
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => null,
});

function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}) {
    const [theme, setThemeState] = useState(
        () => localStorage.getItem(storageKey) || defaultTheme
    );
    const [resolvedTheme, setResolvedTheme] = useState(
        () => (localStorage.getItem(storageKey) || defaultTheme) === "system" ? getSystemTheme() : (localStorage.getItem(storageKey) || defaultTheme)
    );

    // Apply theme class to <html> and listen for OS changes when in "system" mode
    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (resolved) => {
            root.classList.add("theme-transition");
            root.classList.remove("light", "dark");
            root.classList.add(resolved);
            setResolvedTheme(resolved);
            const timeout = setTimeout(() => root.classList.remove("theme-transition"), 350);
            return timeout;
        };

        let timeout;
        if (theme === "system") {
            timeout = applyTheme(getSystemTheme());

            // Listen for real-time OS theme changes
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = (e) => {
                applyTheme(e.matches ? "dark" : "light");
            };
            mediaQuery.addEventListener("change", handleChange);
            return () => {
                clearTimeout(timeout);
                mediaQuery.removeEventListener("change", handleChange);
            };
        } else {
            timeout = applyTheme(theme);
            return () => clearTimeout(timeout);
        }
    }, [theme]);

    const setTheme = (newTheme) => {
        localStorage.setItem(storageKey, newTheme);
        setThemeState(newTheme);
    };

    const value = {
        theme,           // raw preference: "light" | "dark" | "system"
        resolvedTheme,   // actual applied: "light" | "dark"
        setTheme,
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
