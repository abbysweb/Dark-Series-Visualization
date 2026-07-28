/* ==========================================================================
   Theme Configuration - Dark Series Knowledge Graph Visualization
   ========================================================================== */

/*
 * Configurable theme system for Dark Series Visualization
 * Manages light/dark theme modes with persistence
 */

const ThemeConfig = (() => {
    // Default theme configuration
    const DEFAULT_THEMES = {
        dark: {
            name: 'Dark Mode',
            icon: '🌙',
            '--bg': '#0c0e1a',
            '--bg-card': '#14172a',
            '--bg-card-grad': 'linear-gradient(180deg, #14172a 0%, #14172a 100%)',
            '--bg-elevated': '#14172a',
            '--bg-sidebar': '#0a0d1e',
            '--bg-header': '#14172a',
            '--text-primary': '#f0f4ff',
            '--text-secondary': '#9ca3af',
            '--text-muted': '#6b7280',
            '--accent': '#60a5fa',
            '--accent-dim': 'rgba(96,165,250,0.15)',
            '--accent-glow': 'rgba(96,165,250,0.4)',
            '--jonas': '#60a5fa',
            '--martha': '#f87171',
            '--origin': '#fb923c',
            '--other': '#4ade80',
            '--death': '#c084fc',
            '--trigger': '#fbbf24',
            '--border': 'rgba(255,255,255,0.06)',
            '--border-hover': 'rgba(255,255,255,0.12)',
            '--gradient-1': '#0c0e1a',
            '--gradient-2': '#10132a',
            '--gradient-3': '#14172a',
            '--shadow': '0 4px 20px rgba(96,165,250,0.08), 0 1px 4px rgba(0,0,0,0.2)',
            '--shadow-sm': '0 1px 4px rgba(0,0,0,0.3)',
            '--tooltip-bg': 'rgba(20,23,42,0.97)',
            '--tooltip-border': 'rgba(96,165,250,0.2)',
            '--input-bg': '#14172a',
            '--input-border': 'rgba(96,165,250,0.2)',
            '--scrollbar-thumb': 'rgba(96,165,250,0.15)',
            '--scrollbar-track': 'transparent',
        },
        light: {
            name: 'Light Mode',
            icon: '☀️',
            '--bg': '#f8f9fb',
            '--bg-card': '#ffffff',
            '--bg-card-grad': 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
            '--bg-elevated': '#ffffff',
            '--bg-sidebar': '#f5f3f8',
            '--bg-header': '#ffffff',
            '--text-primary': '#1a1a2e',
            '--text-secondary': '#555570',
            '--text-muted': '#8888a0',
            '--accent': '#2563eb',
            '--accent-dim': 'rgba(37,99,235,0.15)',
            '--accent-glow': 'rgba(37,99,235,0.4)',
            '--jonas': '#2563eb',
            '--martha': '#dc2626',
            '--origin': '#ea580c',
            '--other': '#16a34a',
            '--death': '#9333ea',
            '--trigger': '#ca8a04',
            '--border': 'rgba(29,78,216,0.08)',
            '--border-hover': 'rgba(29,78,216,0.12)',
            '--gradient-1': '#0c0e1a',
            '--gradient-2': '#10132a',
            '--gradient-3': '#14172a',
            '--shadow': '0 4px 20px rgba(29,78,216,0.08), 0 1px 4px rgba(0,0,0,0.06)',
            '--shadow-sm': '0 1px 4px rgba(0,0,0,0.06)',
            '--tooltip-bg': 'rgba(255,255,255,0.97)',
            '--tooltip-border': 'rgba(29,78,216,0.12)',
            '--input-bg': '#ffffff',
            '--input-border': 'rgba(29,78,216,0.12)',
            '--scrollbar-thumb': 'rgba(29,78,216,0.12)',
            '--scrollbar-track': 'transparent',
        }
    };

    let currentTheme = 'dark';
    let documentRoot = null;

    const init = () => {
        documentRoot = document.documentElement;
        const savedTheme = localStorage.getItem('dark-series-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        applyTheme(initialTheme);
    };

    const applyTheme = (themeName) => {
        currentTheme = themeName;
        localStorage.setItem('dark-series-theme', themeName);
        
        const theme = DEFAULT_THEMES[themeName];
        if (!theme) return;

        // Apply all CSS custom properties
        Object.entries(theme).forEach(([cssVar, value]) => {
            documentRoot.style.setProperty(cssVar, value);
        });

        // Update page class for compatibility
        document.body.classList.toggle('dark-theme', themeName === 'dark');
        document.body.classList.toggle('light-theme', themeName === 'light');

        // Dispatch event for views to react to theme change
        document.dispatchEvent(new CustomEvent('theme:changed', {
            detail: { theme: themeName, themeData: theme }
        }));
    };

    const toggle = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    const getCurrentTheme = () => currentTheme;

    const getThemeData = (themeName = currentTheme) => DEFAULT_THEMES[themeName];

    const migrateFromLegacy = () => {
        const legacyStyle = document.getElementById('legacy-style');
        if (legacyStyle) {
            const computedBg = getComputedStyle(documentRoot).getPropertyValue('--bg') || '#0c0e1a';
            const isDark = computedBg.includes('#0c0e1a') || computedBg.includes('#10132a');
            applyTheme(isDark ? 'dark' : 'light');
        }
    };

    const exportTheme = () => {
        return {
            current: currentTheme,
            themes: DEFAULT_THEMES
        };
    };

    const importTheme = (themeData) => {
        if (themeData.current && DEFAULT_THEMES[themeData.current]) {
            applyTheme(themeData.current);
            if (themeData.themeConfig && Array.isArray(themeData.themeConfig)) {
                themeData.themeConfig.forEach(item => {
                    if (item.cssVar && item.value) {
                        documentRoot.style.setProperty(item.cssVar, item.value);
                    }
                });
            }
        }
    };

    return {
        init,
        applyTheme,
        toggle,
        getCurrentTheme,
        getThemeData,
        migrateFromLegacy,
        exportTheme,
        importTheme
    };
})();

// Initialize theme system
ThemeConfig.init();
