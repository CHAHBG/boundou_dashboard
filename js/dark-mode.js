// Dark Mode Manager
class DarkModeManager {
    constructor() {
        this.isDarkMode = false;
        this.themeToggle = null;
        this.init();
    }

    init() {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('procasef-theme');
        if (savedTheme === 'dark') {
            this.enableDarkMode();
        }

        // Setup toggle button
        this.themeToggle = document.getElementById('themeToggle');
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        this.isDarkMode = true;
        localStorage.setItem('procasef-theme', 'dark');
        this.updateToggleIcon();
    }

    disableDarkMode() {
        document.body.classList.remove('dark-mode');
        this.isDarkMode = false;
        localStorage.setItem('procasef-theme', 'light');
        this.updateToggleIcon();
    }

    toggleTheme() {
        if (this.isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    updateToggleIcon() {
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                if (this.isDarkMode) {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        }
    }
}

// Initialize dark mode on page load
document.addEventListener('DOMContentLoaded', () => {
    window.darkModeManager = new DarkModeManager();
});
