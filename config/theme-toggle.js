/* ==========================================================================
   Theme Toggle Module - Dark Series Knowledge Graph Visualization
   ========================================================================== */

/*
 * UI components and functionality for theme switching
 * Adds theme toggle button and switch to the header navigation
 */

const ThemeToggle = (() => {
    let currentThemeElement = null;
    let alternateThemeElement = null;

    const THEMES = {
        dark: {
            label: 'Switch to Light Mode',
            ariaLabel: 'Switch to Light Mode'
        },
        light: {
            label: 'Switch to Dark Mode',
            ariaLabel: 'Switch to Dark Mode'
        }
    };

    const init = () => {
        createToggleButton();
        updateToggleStates();
        ThemeConfig.init();
    };

    const createToggleButton = () => {
        const brandElement = document.querySelector('.brand');
        if (!brandElement) return;

        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle';
        toggleContainer.innerHTML = `
            <button class="theme-toggle-btn" id="theme-toggle-btn"
                    title="Toggle theme" aria-label="Toggle theme">
                <span class="theme-toggle-icon"></span>
            </button>
        `;

        // Insert after brand
        brandElement.insertAdjacentElement('afterend', toggleContainer);

        attachToggleEventListeners();
    };

    const attachToggleEventListeners = () => {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', handleToggleClick);
            toggleBtn.addEventListener('keydown', handleToggleKeyDown);
        }
    };

    const handleToggleClick = (event) => {
        event.stopPropagation();
        const currentTheme = ThemeConfig.getCurrentTheme();
        ThemeConfig.toggle();
        updateToggleDisplay(currentTheme);
    };

    const handleToggleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const currentTheme = ThemeConfig.getCurrentTheme();
            ThemeConfig.toggle();
            updateToggleDisplay(currentTheme);
        }
    };

    const updateToggleDisplay = (previousTheme) => {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (!themeToggleBtn) return;

        const currentTheme = ThemeConfig.getCurrentTheme();
        const themeData = THEMES[currentTheme];
        
        if (!themeData) return;

        const icon = themeToggleBtn.querySelector('.theme-toggle-icon');
        if (icon) {
            icon.textContent = ThemeConfig.getThemeData(currentTheme).icon;
            themeToggleBtn.title = themeData.label;
            themeToggleBtn.setAttribute('aria-label', themeData.ariaLabel);
        }
    };

    const updateToggleStates = () => {
        const currentTheme = ThemeConfig.getCurrentTheme();
        updateToggleDisplay(currentTheme);
    };

    const syncSystemTheme = () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('dark-series-theme');
        
        if (!savedTheme) {
            ThemeConfig.applyTheme(prefersDark ? 'dark' : 'light');
        }
    };

    return {
        init,
        updateToggleStates,
        syncSystemTheme
    };
})();

// Initialize theme toggle
ThemeToggle.init();
