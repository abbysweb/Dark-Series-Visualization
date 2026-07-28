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
            '--bg': '#0a0a0f',
            '--bg-card': 'rgba(255, 255, 255, 0.04)',
            '--bg-card-grad': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            '--bg-elevated': 'rgba(255, 255, 255, 0.06)',
            '--bg-sidebar': 'rgba(255, 255, 255, 0.03)',
            '--bg-header': 'rgba(10, 10, 15, 0.80)',
            '--text-primary': '#e8e8f0',
            '--text-secondary': '#9a9ab0',
            '--text-muted': '#6a6a80',
            '--accent': '#7c9aff',
            '--accent-dim': 'rgba(124, 154, 255, 0.12)',
            '--accent-glow': 'rgba(124, 154, 255, 0.25)',
            '--jonas': '#7c9aff',
            '--martha': '#ff7c7c',
            '--origin': '#ffb07c',
            '--other': '#7cffb0',
            '--death': '#c88cff',
            '--trigger': '#ffd07c',
            '--border': 'rgba(255, 255, 255, 0.08)',
            '--border-hover': 'rgba(255, 255, 255, 0.16)',
            '--gradient-1': '#0a0a0f',
            '--gradient-2': '#0f0f18',
            '--gradient-3': '#14141e',
            '--shadow': '0 8px 32px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
            '--shadow-sm': '0 4px 16px rgba(0,0,0,0.3)',
            '--tooltip-bg': 'rgba(20, 20, 30, 0.90)',
            '--tooltip-border': 'rgba(255, 255, 255, 0.10)',
            '--input-bg': 'rgba(255, 255, 255, 0.04)',
            '--input-border': 'rgba(255, 255, 255, 0.10)',
            '--scrollbar-thumb': 'rgba(255, 255, 255, 0.10)',
            '--scrollbar-track': 'transparent',
            '--glass-bg': 'rgba(255, 255, 255, 0.04)',
            '--glass-border': 'rgba(255, 255, 255, 0.08)',
            '--glass-shadow': '0 8px 32px rgba(0,0,0,0.3)',
            '--glass-blur': 'blur(16px)',
        },
        light: {
            name: 'Light Mode',
            icon: '☀️',
            '--bg': '#f0f2f8',
            '--bg-card': 'rgba(255, 255, 255, 0.60)',
            '--bg-card-grad': 'linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.40) 100%)',
            '--bg-elevated': 'rgba(255, 255, 255, 0.70)',
            '--bg-sidebar': 'rgba(255, 255, 255, 0.50)',
            '--bg-header': 'rgba(240, 242, 248, 0.85)',
            '--text-primary': '#1a1a2e',
            '--text-secondary': '#555570',
            '--text-muted': '#8888a0',
            '--accent': '#4a6cf7',
            '--accent-dim': 'rgba(74, 108, 247, 0.10)',
            '--accent-glow': 'rgba(74, 108, 247, 0.20)',
            '--jonas': '#4a6cf7',
            '--martha': '#e53e3e',
            '--origin': '#e67e22',
            '--other': '#2ecc71',
            '--death': '#8e44ad',
            '--trigger': '#d4a017',
            '--border': 'rgba(0, 0, 0, 0.06)',
            '--border-hover': 'rgba(0, 0, 0, 0.12)',
            '--gradient-1': '#f0f2f8',
            '--gradient-2': '#e8ecf4',
            '--gradient-3': '#e0e5f0',
            '--shadow': '0 8px 32px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            '--shadow-sm': '0 4px 16px rgba(0,0,0,0.04)',
            '--tooltip-bg': 'rgba(255,255,255,0.95)',
            '--tooltip-border': 'rgba(0,0,0,0.08)',
            '--input-bg': 'rgba(255, 255, 255, 0.60)',
            '--input-border': 'rgba(0, 0, 0, 0.08)',
            '--scrollbar-thumb': 'rgba(0, 0, 0, 0.08)',
            '--scrollbar-track': 'transparent',
            '--glass-bg': 'rgba(255, 255, 255, 0.50)',
            '--glass-border': 'rgba(255, 255, 255, 0.70)',
            '--glass-shadow': '0 8px 32px rgba(0,0,0,0.06)',
            '--glass-blur': 'blur(12px)',
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
