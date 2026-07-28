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
            bgPrimary: '#0c0e1a',
            bgSecondary: '#14172a',
            bgAccent: '#1a1e2e',
            textPrimary: '#f0f4ff',
            textSecondary: '#9ca3af',
            border: 'rgba(255,255,255,0.06)',
            borderHover: 'rgba(255,255,255,0.12)',
            controlBg: '#ffffff',
            controlBorder: 'rgba(96,165,250,0.2)',
            controlText: '#f0f4ff',
            tooltipBg: 'rgba(20,23,42,0.97)',
            tooltipBorder: 'rgba(96,165,250,0.2)',
            gradient1: '#0c0e1a',
            gradient2: '#10132a',
            gradient3: '#14172a',
            shadow: '0 4px 20px rgba(96,165,250,0.08), 0 1px 4px rgba(0,0,0,0.2)',
            shadowSm: '0 1px 4px rgba(0,0,0,0.3)',
        },
        light: {
            bgPrimary: '#f8f9fb',
            bgSecondary: '#ffffff',
            bgAccent: '#f2f5ff',
            textPrimary: '#1a1a2e',
            textSecondary: '#555570',
            border: 'rgba(29,78,216,0.08)',
            borderHover: 'rgba(29,78,216,0.12)',
            controlBg: '#ffffff',
            controlBorder: 'rgba(29,78,216,0.12)',
            controlText: '#1a1a2e',
            tooltipBg: 'rgba(255,255,255,0.97)',
            tooltipBorder: 'rgba(29,78,216,0.12)',
            gradient1: '#0c0e1a',
            gradient2: '#10132a',
            gradient3: '#14172a',
            shadow: '0 4px 20px rgba(29,78,216,0.08), 0 1px 4px rgba(0,0,0,0.06)',
            shadowSm: '0 1px 4px rgba(0,0,0,0.06)',
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
        inlineStyles.deleteRule(0);
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
            /* Theme-aware base styles */
            body {
                background: linear-gradient(160deg, ${themeVars.gradient1} 0%, ${themeVars.gradient2} 30%, ${themeVars.gradient3} 60%, ${themeVars.gradient1} 100%) !important;
                color: ${themeVars.textPrimary} !important;
            }

            /* Theme-aware view controls */
            .view-controls {
                background: linear-gradient(180deg, ${themeVars.bgPrimary} 0%, ${themeVars.bgSecondary} 100%) !important;
                border-color: ${themeVars.border} !important;
                box-shadow: ${themeVars.shadowSm} !important;
            }

            /* Theme-aware containers */
            #view-temporal #visualization-container,
            #view-network #network-container,
            #view-barchart #barchart-container,
            #view-analytics #analytics-container,
            #view-timeline #timeline-container {
                background-color: ${themeVars.bgPrimary} !important;
            }

            /* Theme-aware tooltips */
            .tooltip {
                background-color: ${themeVars.tooltipBg} !important;
                border-color: ${themeVars.tooltipBorder} !important;
                color: ${themeVars.textPrimary} !important;
            }

            /* Theme-aware select controls */
            .select-control {
                background-color: ${themeVars.controlBg} !important;
                border-color: ${themeVars.controlBorder} !important;
                color: ${themeVars.controlText} !important;
            }

            /* Theme-aware stat badges */
            .stat-badge {
                background-color: ${themeVars.controlBg} !important;
                border-color: ${themeVars.controlBorder} !important;
                color: ${themeVars.textSecondary} !important;
            }

            /* Theme-aware SVG backgrounds */
            #network-graph,
            #bar-chart,
            #analytics-chart,
            #timeline-svg {
                background: linear-gradient(180deg, ${themeVars.bgPrimary} 0%, ${themeVars.bgSecondary} 100%) !important;
            }

            /* Theme-aware sidebar */
            .kg-sidebar {
                background: ${themeVars.bgPrimary} !important;
                border-color: ${themeVars.border} !important;
            }

            /* Theme-aware timeline world bands */
            .timeline-world-band {
                fill: ${themeVars.bgAccent} !important;
            }

            /* Theme-aware tooltips */
            #tooltip,
            #kg-tooltip,
            #network-tooltip,
            #barchart-tooltip,
            #analytics-tooltip,
            #timeline-tooltip,
            #timeline-detail {
                background-color: ${themeVars.tooltipBg} !important;
                border-color: ${themeVars.tooltipBorder} !important;
                color: ${themeVars.textPrimary} !important;
            }

            /* Theme-aware scrollbar */
            *::-webkit-scrollbar-thumb {
                background-color: ${themeVars.controlBorder} !important;
            }

            /* Theme-aware SVG stroke colors */
            .node.jonas   { fill: var(--jonas) !important; }
            .node.martha  { fill: var(--martha) !important; }
            .node.other   { fill: var(--other) !important; }
            .node.important { fill: var(--trigger) !important; }
            .node.death   { stroke: var(--death) !important; }
            .node.start   { fill: var(--accent) !important; }

            /* Theme transition effect */
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
