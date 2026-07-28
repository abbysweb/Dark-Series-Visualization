#!/usr/bin/env bash

# Theme Toggle Script for Dark Series Knowledge Graph Visualization
# Provides a command-line interface to toggle between light and dark themes

THEME_CONFIG_FILE="~/.dark-series-theme"
DARK_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WD="#!!!WORKSPACE_ROOT!#!"

# Load the theme system
load_theme_system() {
    local node_path="$WD/config/theme-config.js"
    if [ ! -f "$node_path" ]; then
        echo "❌ Theme system not found at $node_path" >&2
        return 1
    fi
    return 0
}

# Get current theme
_get_current_theme() {
    local saved_theme=$(node -e "
        try {
            if (require('fs').existsSync('$WD/config/theme-config.js')) {
                delete require.cache[require.resolve('$WD/config/theme-config.js')];
                const ThemeConfig = require('$WD/config/theme-config.js');
                console.log(ThemeConfig.getCurrentTheme ? ThemeConfig.getCurrentTheme() : 'unknown');
            } else {
                console.log('missing');
            }
        } catch(e) {
            console.log('error');
        }
    " 2>/dev/null)
    echo "$saved_theme"
}

# Toggle theme
toggle_theme() {
    local result=$(node -e "
        try {
            if (require('fs').existsSync('$WD/config/theme-config.js')) {
                delete require.cache[require.resolve('$WD/config/theme-config.js')];
                const ThemeConfig = require('$WD/config/theme-config.js');
                ThemeConfig.toggle();
                console.log(ThemeConfig.getCurrentTheme ? ThemeConfig.getCurrentTheme() : 'toggled');
            } else {
                console.log('missing');
            }
        } catch(e) {
            console.log('error:' + e.message);
        }
    " 2>/dev/null)
    
    if [[ "$result" == "missing" ]]; then
        echo "❌ Theme system not found" >&2
        return 1
    elif [[ "$result" == "error"* ]]; then
        echo "❌ Error occurred while toggling theme: $result" >&2
        return 1
    else
        echo "✅ Theme toggled successfully to $result"
        local icon=$(node -e "
            try {
                if (require('fs').existsSync('$WD/config/theme-config.js')) {
                    delete require.cache[require.resolve('$WD/config/theme-config.js')];
                    const ThemeConfig = require('$WD/config/theme-config.js');
                    const theme = ThemeConfig.getCurrentTheme ? ThemeConfig.getCurrentTheme() : 'dark';
                    const themeData = ThemeConfig.getThemeData ? ThemeConfig.getThemeData(theme) : {};
                    console.log(themeData.icon || '');
                }
            } catch(e) {}
        " 2>/dev/null)
        return 0
    fi
}

# Show help
help() {
    cat << EOF
🎨 Dark Series Theme Toggle Utility

Usage: $(basename "$0") [COMMAND] [OPTIONS]

Commands:
  toggle     Toggle between light and dark themes
  status     Show current theme status
  reset      Reset to system preference (use localStorage if saved)
  list       List all available themes

Examples:
  $(basename "$0") toggle    Toggle to the opposite theme
  $(basename "$0") status    Show current theme (dark/light)
  $(basename "$0") reset     Reset to system default theme

EOF
}

# Show status
show_status() {
    local current=$(get_current_theme)
    local theme_path="$WD/config/theme-config.js"
    
    if [ ! -f "$theme_path" ]; then
        echo "❌ Theme system not found" >&2
        return 1
    fi
    
    echo "🎨 Dark Series Theme Status"
    echo "=========================="
    echo "Current theme: $current"
    
    # Get theme info from theme-config.js
    local theme_info=$(node -e "
        try {
            if (require('fs').existsSync('$theme_path')) {
                delete require.cache[require.resolve('$theme_path')];
                const ThemeConfig = require('$theme_path');
                const currentTheme = ThemeConfig.getCurrentTheme ? ThemeConfig.getCurrentTheme() : 'unknown';
                const themeData = ThemeConfig.getThemeData ? ThemeConfig.getThemeData(currentTheme) : null;
                console.log('Name:', themeData ? themeData.name : 'Unknown');
                console.log('Icon:', themeData ? themeData.icon : '?');
                console.log('Available:', Object.keys(ThemeConfig.getThemeData ? ThemeConfig.getThemeData() : {}).join(', '));
            }
        } catch(e) {
            console.log('Error:', e.message);
        }
    " 2>/dev/null)
    
    echo "$theme_info"
    echo "Status: Theme system initialized and active"
}

# List available themes
list_themes() {
    local theme_path="$WD/config/theme-config.js"
    
    if [ ! -f "$theme_path" ]; then
        echo "❌ Theme system not found" >&2
        return 1
    fi
    
    echo "📋 Available Themes"
    echo "==================="
    echo "$theme_path" | node -e "
        try {
            delete require.cache[require.resolve('$WD/config/theme-config.js')];
            const ThemeConfig = require('$WD/config/theme-config.js');
            const themes = ThemeConfig.getThemeData ? ['dark', 'light'] : ['default'];
            themes.forEach(themeName => {
                const themeData = ThemeConfig.getThemeData ? ThemeConfig.getThemeData(themeName) : null;
                if (themeData) {
                    console.log(`• ${themeName.padEnd(8)}: ${themeData.name} (${themeData.icon})`);
                }
            });
        } catch(e) {
            console.log('Error listing themes:', e.message);
        }
    " 2>/dev/null
}

# Reset to system preference
reset_theme() {
    local saved_theme=$(node -e "
        try {
            if (require('fs').existsSync('$WD/config/theme-config.js')) {
                delete require.cache[require.resolve('$WD/config/theme-config.js')];
                const ThemeConfig = require('$WD/config/theme-config.js');
                if (ThemeConfig.getCurrentTheme) {
                    const current = ThemeConfig.getCurrentTheme();
                    if (localStorage.getItem('dark-series-theme')) {
                        localStorage.removeItem('dark-series-theme');
                        console.log('reset_success');
                    } else {
                        console.log('already_reset');
                    }
                }
            }
        } catch(e) {
            console.log('error:' + e.message);
        }
    " 2>/dev/null)
    
    if [[ "$result" == "reset_success" ]]; then
        echo "✅ Theme reset to system preference"
        toggle_theme
    elif [[ "$result" == "already_reset" ]]; then
        echo "ℹ️  Theme was already reset to system preference"
    else
        echo "❌ Failed to reset theme: $saved_theme" >&2
    fi
}

# Main command handler
main() {
    if [ $# -eq 0 ]; then
        help
        exit 1
    fi

    case "$1" in
        toggle|t)
            toggle_theme
            ;;
        status|s)
            show_status
            ;;
        list|l)
            list_themes
            ;;
        reset|r)
            reset_theme
            ;;
        help|--help|-h|?)
            help
            ;;
        *)
            echo "❌ Unknown command: $1" >&2
            help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
