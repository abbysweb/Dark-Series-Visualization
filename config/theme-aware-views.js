/* ==========================================================================
   Theme-aware styles for individual views
   ========================================================================== */

/**
 * Theme-aware styling for all visualization views
 * Automatically updates styling when theme changes
 */

const ThemeAwareViewStyles = (() => {
    const THEMES = {
        dark: {
            bgPrimary: 'var(--bg)',
            bgSecondary: 'var(--bg-card)',
            bgAccent: 'var(--bg-sidebar)',
            textPrimary: 'var(--text-primary)',
            textSecondary: 'var(--text-secondary)',
            border: 'var(--glass-border)',
            borderHover: 'var(--border-hover)',
            controlBg: 'var(--glass-bg)',
            controlBorder: 'var(--glass-border)',
            controlText: 'var(--text-primary)',
            tooltipBg: 'var(--tooltip-bg)',
            tooltipBorder: 'var(--tooltip-border)',
            gradient1: 'var(--gradient-1)',
            gradient2: 'var(--gradient-2)',
            gradient3: 'var(--gradient-3)',
            shadow: 'var(--glass-shadow)',
            shadowSm: 'var(--shadow-sm)',
        },
        light: {
            bgPrimary: 'var(--bg)',
            bgSecondary: 'var(--bg-card)',
            bgAccent: 'var(--bg-sidebar)',
            textPrimary: 'var(--text-primary)',
            textSecondary: 'var(--text-secondary)',
            border: 'var(--glass-border)',
            borderHover: 'var(--border-hover)',
            controlBg: 'var(--glass-bg)',
            controlBorder: 'var(--glass-border)',
            controlText: 'var(--text-primary)',
            tooltipBg: 'var(--tooltip-bg)',
            tooltipBorder: 'var(--tooltip-border)',
            gradient1: 'var(--gradient-1)',
            gradient2: 'var(--gradient-2)',
            gradient3: 'var(--gradient-3)',
            shadow: 'var(--glass-shadow)',
            shadowSm: 'var(--shadow-sm)',
        }
    };

    let currentTheme = 'dark';
    let stylesheets = {};

    const init = () => {
        currentTheme = ThemeConfig.getCurrentTheme();
        initStylesheets();
        applyTheme(currentTheme, THEMES[currentTheme]);
        observeThemeChanges();
    };

    const initStylesheets = () => {
        stylesheets = {
            main: document.createElement('style'),
            jsView: document.createElement('style'),
        };
        stylesheets.main.id = 'theme-cs-main';
        stylesheets.jsView.id = 'theme-cs-jsview';
        document.head.appendChild(stylesheets.main);
        document.head.appendChild(stylesheets.jsView);

        // Apply initial styles to existing elements
        applyGlobalStyles(currentTheme);
    };

    const observeThemeChanges = () => {
        document.addEventListener('theme:changed', handleThemeChange);
    };

    const handleThemeChange = (event) => {
        currentTheme = event.detail.theme;
        applyTheme(currentTheme, THEMES[currentTheme]);
        applyGlobalStyles(currentTheme);
    };

    const applyTheme = (themeName, themeVars) => {
        const root = document.documentElement;
        const inlineStyles = stylesheets.main.sheet;

        // Clear and rebuild main stylesheet with current theme
        while (inlineStyles.cssRules.length > 0) {
            inlineStyles.deleteRule(0);
        }
        inlineStyles.insertRule(generateThemeCSS(themeVars), 0);

        // Update JavaScript view modules if they have theme-aware methods
        if (typeof window !== 'undefined' && window.KGView && typeof KGView.updateForTheme === 'function') {
            KGView.updateForTheme(themeVars);
        }
        if (typeof window !== 'undefined' && window.Visualization && typeof Visualization.updateForTheme === 'function') {
            Visualization.updateForTheme(themeVars);
        }
        if (typeof window !== 'undefined' && window.NetworkGraph && typeof NetworkGraph.updateForTheme === 'function') {
            NetworkGraph.updateForTheme(themeVars);
        }
        if (typeof window !== 'undefined' && window.BarChart && typeof BarChart.updateForTheme === 'function') {
            BarChart.updateForTheme(themeVars);
        }
        if (typeof window !== 'undefined' && window.Analytics && typeof Analytics.updateForTheme === 'function') {
            Analytics.updateForTheme(themeVars);
        }
        if (typeof window !== 'undefined' && window.Timeline && typeof Timeline.updateForTheme === 'function') {
            Timeline.updateForTheme(themeVars);
        }
    };

    const generateThemeCSS = (themeVars) => {
        return `
            body {
                background: linear-gradient(160deg, var(--gradient-1) 0%, var(--gradient-2) 30%, var(--gradient-3) 60%, var(--gradient-1) 100%) !important;
            }
            #network-graph,
            #bar-chart,
            #analytics-chart,
            #timeline-svg {
                background: var(--bg) !important;
            }
            .timeline-world-band {
                fill: var(--bg-sidebar) !important;
            }
            .node.jonas   { fill: var(--jonas) !important; }
            .node.martha  { fill: var(--martha) !important; }
            .node.other   { fill: var(--other) !important; }
            .node.important { fill: var(--trigger) !important; }
            .node.death   { stroke: var(--death) !important; }
            .node.start   { fill: var(--accent) !important; }
            * {
                transition: background-color 0.3s ease, 
                            border-color 0.3s ease,
                            color 0.3s ease,
                            fill 0.3s ease,
                            stroke 0.3s ease,
                            box-shadow 0.3s ease;
            }
        `;
    };

    const applyGlobalStyles = (themeName) => {
        const themeVars = THEMES[themeName];
        const inlineStyles = stylesheets.jsView.sheet;

        // Clear and rebuild JS view stylesheet
        while (inlineStyles.cssRules.length > 0) {
            inlineStyles.deleteRule(0);
        }

        // Create a dynamic CSS rule from the theme CSS
        const themeCSS = generateThemeCSS(themeVars);
        const styleBlock = document.createElement('style');
        styleBlock.id = 'dynamic-theme-styles';
        styleBlock.textContent = themeCSS;

        // Replace existing style element
        const existingStyle = document.getElementById('dynamic-theme-styles');
        if (existingStyle) existingStyle.remove();
        document.head.appendChild(styleBlock);
    };

    return {
        init,
        applyTheme,
        applyGlobalStyles,
        getCurrentTheme: () => currentTheme,
        getThemeVariables: (themeName = currentTheme) => THEMES[themeName]
    };
})();

// Initialize theme-aware view styles
ThemeAwareViewStyles.init();
