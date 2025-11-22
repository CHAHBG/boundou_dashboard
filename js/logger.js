/**
 * Logger Utility - Production-safe logging system
 * Controls console output based on environment
 */
class Logger {
    /**
     * Set to 'development' to enable all logs, 'production' to show only errors
     * @type {'development' | 'production'}
     */
    static level = 'production';

    /**
     * Enable/disable logging (can be controlled via localStorage)
     */
    static enabled = localStorage.getItem('debug') === 'true' || Logger.level === 'development';

    /**
     * Log informational messages (development only)
     * @param {...any} args - Arguments to log
     */
    static log(...args) {
        if (this.enabled) {
            console.log('%c[INFO]', 'color: #3b82f6; font-weight: bold;', ...args);
        }
    }

    /**
     * Log warning messages (development only)
     * @param {...any} args - Arguments to log
     */
    static warn(...args) {
        if (this.enabled) {
            console.warn('%c[WARN]', 'color: #f59e0b; font-weight: bold;', ...args);
        }
    }

    /**
     * Log error messages (always shown)
     * @param {...any} args - Arguments to log
     */
    static error(...args) {
        console.error('%c[ERROR]', 'color: #ef4444; font-weight: bold;', ...args);
    }

    /**
     * Log success messages (development only)
     * @param {...any} args - Arguments to log
     */
    static success(...args) {
        if (this.enabled) {
            console.log('%c[SUCCESS]', 'color: #10b981; font-weight: bold;', ...args);
        }
    }

    /**
     * Enable debug mode dynamically
     */
    static enableDebug() {
        localStorage.setItem('debug', 'true');
        this.enabled = true;
        this.success('Debug mode enabled. Reload to see all logs.');
    }

    /**
     * Disable debug mode
     */
    static disableDebug() {
        localStorage.removeItem('debug');
        this.enabled = false;
        console.log('Debug mode disabled.');
    }
}

// Make Logger available globally
if (typeof window !== 'undefined') {
    window.Logger = Logger;

    // Add helper functions to window for easy access in console
    window.enableDebug = () => Logger.enableDebug();
    window.disableDebug = () => Logger.disableDebug();
}
