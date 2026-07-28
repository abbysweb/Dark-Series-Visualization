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

    let currentTheme = 'light';
    let documentRoot = null;

    const init = () => {
        documentRoot = document.documentElement;
        applyTheme('light');
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

        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');

        // Dispatch event for views to react to theme change
        document.dispatchEvent(new CustomEvent('theme:changed', {
            detail: { theme: themeName, themeData: theme }
        }));
    };

    const toggle = () => {};

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
