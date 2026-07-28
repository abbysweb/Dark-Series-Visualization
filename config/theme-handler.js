/* ==========================================================================
   Theme Update Handler - Updates views when theme changes
   ========================================================================== */

const ThemeHandler = (() => {
    let theme = 'dark';
    let observers = [];

    const init = () => {
        theme = ThemeConfig.getCurrentTheme();
        ThemeConfig.init();
        observeThemeChanges();
    };

    const observeThemeChanges = () => {
        document.addEventListener('theme:changed', handleThemeChange);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange);
    };

    const handleThemeChange = (event) => {
        theme = event.detail.theme;
        updateViewsForTheme(event.detail.themeData);
        updateToggleDisplay();
        saveThemePreference(theme);
    };

    const handleSystemThemeChange = (event) => {
        const savedTheme = localStorage.getItem('dark-series-theme');
        if (!savedTheme) {
            ThemeConfig.applyTheme(event.matches ? 'dark' : 'light');
        }
    };

    const updateViewsForTheme = (themeData) => {
        const viewsToUpdate = [
            { name: 'KGView', manager: KGView },
            { name: 'Visualization', manager: Visualization },
            { name: 'NetworkGraph', manager: NetworkGraph },
            { name: 'BarChart', manager: BarChart },
            { name: 'Analytics', manager: Analytics },
            { name: 'Timeline', manager: Timeline },
            { name: 'KGSearch', manager: KGSearch },
            { name: 'KGInspector', manager: KGInspector },
            { name: 'KGPathfinder', manager: KGPathfinder },
            { name: 'LayoutLogic', manager: LayoutLogic }
        ];

        viewsToUpdate.forEach(view => {
            if (view.manager && typeof view.manager.updateForTheme === 'function') {
                try {
                    view.manager.updateForTheme(themeData);
                } catch (e) {
                    console.warn(`[${view.name}] Failed to update for theme:`, e);
                }
            }
        });
    };

    const updateToggleDisplay = () => {
        if (typeof ThemeToggle !== 'undefined' && ThemeToggle.updateToggleStates) {
            ThemeToggle.updateToggleStates();
        }
    };

    const saveThemePreference = (themeName) => {
        localStorage.setItem('dark-series-theme', themeName);
        document.cookie = `dark-series-theme=${themeName}; max-age=31536000; path=/`;
    };

    const getCurrentTheme = () => theme;

    const applySystemPreference = () => {
        const savedTheme = localStorage.getItem('dark-series-theme');
        if (!savedTheme) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            ThemeConfig.applyTheme(prefersDark ? 'dark' : 'light');
        }
    };

    return {
        init,
        getCurrentTheme,
        applySystemPreference,
        handleThemeChange,
        updateViewsForTheme
    };
})();

// Initialize theme handler before other modules
ThemeHandler.init();
