// ===========================================================================
   // Theme-aware data models for consistent theming across all components
   // ==========================================================================

const ThemeModels = {
    // Default color schemes for easy theming
    colors: {
        dark: {
            primary: '#60a5fa',
            success: '#4ade80',
            warning: '#fbbf24',
            danger: '#f87171',
            info: '#c084fc',
            text: '#f0f4ff',
            textSecondary: '#9ca3af',
            background: '#0c0e1a',
            surface: '#14172a',
            border: 'rgba(255,255,255,0.06)',
            overlay: 'rgba(0,0,0,0.7)',
            chartBlue: '#3b82f6',
            chartRed: '#ef4444',
            chartGreen: '#10b981',
            chartOrange: '#f59e0b',
            chartPurple: '#a855f7',
        },
        light: {
            primary: '#2563eb',
            success: '#16a34a',
            warning: '#ca8a04',
            danger: '#dc2626',
            info: '#9333ea',
            text: '#1a1a2e',
            textSecondary: '#555570',
            background: '#f8f9fb',
            surface: '#ffffff',
            border: 'rgba(29,78,216,0.08)',
            overlay: 'rgba(255,255,255,0.9)',
            chartBlue: '#2563eb',
            chartRed: '#dc2626',
            chartGreen: '#16a34a',
            chartOrange: '#ea580c',
            chartPurple: '#9333ea',
        }
    },

    // Update CSS variables for the current theme
    updateCSSVariables: function(themeName) {
        const theme = this.colors[themeName] || this.colors.dark;
        const root = document.documentElement;

        // Map color names to CSS variables
        const variableMap = {
            '--accent': 'primary',
            '--other': 'success',
            '--trigger': 'warning',
            '--death': 'danger',
            '--jonas': 'chartBlue',
            '--martha': 'chartRed',
            '--origin': 'chartOrange',
            '--bg': 'background',
            '--bg-card': 'surface',
            '--bg-elevated': 'surface',
            '--bg-sidebar': theme.background,
            '--bg-header': 'surface',
            '--text-primary': 'text',
            '--text-secondary': 'textSecondary',
            '--text-muted': 'textSecondary',
            '--border': 'border',
            '--border-hover': 'border',
            '--shadow': 'overlay',
            '--shadow-sm': 'overlay',
            '--tooltip-bg': 'surface',
            '--tooltip-border': 'border',
            '--input-bg': 'surface',
            '--input-border': 'border',
            '--scrollbar-thumb': themeName === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(29,78,216,0.12)',
        };

        Object.entries(variableMap).forEach(([cssVar, colorKey]) => {
            const value = this.getHSLColor(theme[colorKey]);
            if (value) {
                root.style.setProperty(cssVar, value);
            }
        });

        // Update theme-specific styles
        document.body.classList.toggle('dark-theme', themeName === 'dark');
        document.body.classList.toggle('light-theme', themeName === 'light');
    },

    // Convert hex color to HSL for CSS color manipulation
    getHSLColor: function(hex) {
        if (!hex) return null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = hex;
        return ctx.fillStyle;
    },

    // Get color by theme and type
    getColor: function(themeName, colorType) {
        return this.colors[themeName]?.[colorType] || this.colors.dark[colorType];
    }
};
