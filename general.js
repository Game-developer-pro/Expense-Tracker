function checkToken() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;

    // Skip redirect if already on login or signup page
    if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
        return;
    }

    if (!token) {
        window.location.href = 'login.html';
    }
}

checkToken();

/**
 * Update navigation visibility based on authentication status
 * Hides Login/Signup when logged in, hides Logout when logged out
 */
function updateNavAuthState() {
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    // Find navigation links
    const navList = document.querySelector('.nav-list');
    if (!navList) return;

    // Find login, signup, and logout elements
    const loginLink = navList.querySelector('a[href="login.html"]');
    const signupLink = navList.querySelector('a[href="signup.html"]');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isLoggedIn) {
        // User is logged in - hide login and signup, show logout
        if (loginLink) {
            loginLink.closest('li').style.display = 'none';
        }
        if (signupLink) {
            signupLink.closest('li').style.display = 'none';
        }
        if (logoutBtn) {
            logoutBtn.closest('li').style.display = '';
        }
    } else {
        // User is logged out - show login and signup, hide logout
        if (loginLink) {
            loginLink.closest('li').style.display = '';
        }
        if (signupLink) {
            signupLink.closest('li').style.display = '';
        }
        if (logoutBtn) {
            logoutBtn.closest('li').style.display = 'none';
        }
    }
}

// Update nav auth state when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavAuthState);
} else {
    updateNavAuthState();
}

/**
 * Show an error message below a button
 * @param {string} buttonId - The ID of the button element
 * @param {string} message - The error message to display
 * @param {number} duration - How long to show the error (in ms), 0 = permanent until cleared
 */
function showButtonError(buttonId, message, duration = 5000) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    // Check if error element already exists
    let errorEl = button.parentElement.querySelector('.button-error-message');

    if (!errorEl) {
        // Create new error element
        errorEl = document.createElement('div');
        errorEl.className = 'button-error-message';
        errorEl.style.cssText = `
            color: #EF4444;
            font-size: 0.875rem;
            margin-top: 0.75rem;
            text-align: center;
            padding: 0.5rem 1rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(239, 68, 68, 0.2);
            animation: fadeIn 0.3s ease;
        `;
        button.parentElement.insertBefore(errorEl, button.nextSibling);
    }

    // Set the message
    errorEl.textContent = message;
    errorEl.style.display = 'block';

    // Auto-hide after duration (if not 0)
    if (duration > 0) {
        setTimeout(() => {
            hideButtonError(buttonId);
        }, duration);
    }
}

/**
 * Hide the error message below a button
 * @param {string} buttonId - The ID of the button element
 */
function hideButtonError(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const errorEl = button.parentElement.querySelector('.button-error-message');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

/**
 * Show a success message below a button
 * @param {string} buttonId - The ID of the button element
 * @param {string} message - The success message to display
 * @param {number} duration - How long to show the message (in ms)
 */
function showButtonSuccess(buttonId, message, duration = 3000) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    // Check if message element already exists
    let msgEl = button.parentElement.querySelector('.button-success-message');

    if (!msgEl) {
        // Create new message element
        msgEl = document.createElement('div');
        msgEl.className = 'button-success-message';
        msgEl.style.cssText = `
            color: #10B981;
            font-size: 0.875rem;
            margin-top: 0.75rem;
            text-align: center;
            padding: 0.5rem 1rem;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(16, 185, 129, 0.2);
            animation: fadeIn 0.3s ease;
        `;
        button.parentElement.insertBefore(msgEl, button.nextSibling);
    }

    // Set the message
    msgEl.textContent = message;
    msgEl.style.display = 'block';

    // Auto-hide after duration
    if (duration > 0) {
        setTimeout(() => {
            msgEl.style.display = 'none';
        }, duration);
    }
}

// Add fadeIn animation to the document
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// ===========================================
// Theme Toggle Functionality
// ===========================================

/**
 * Get the current theme preference
 * @returns {string} 'light' or 'dark'
 */
function getThemePreference() {
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'light';
}

/**
 * Apply the theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getThemePreference();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
}

/**
 * Initialize theme on page load
 */
function initTheme() {
    const theme = getThemePreference();
    applyTheme(theme);
}

/**
 * Create and insert the theme toggle button into the navigation
 */
function createThemeToggle() {
    const navList = document.querySelector('.nav-list');
    if (!navList) return;

    // Check if toggle already exists
    if (document.getElementById('theme-toggle')) return;

    // Create the toggle button
    const toggleLi = document.createElement('li');
    toggleLi.innerHTML = `
        <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark/light mode" title="Toggle theme">
            <svg class="sun-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z">
                </path>
            </svg>
            <svg class="moon-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z">
                </path>
            </svg>
        </button>
    `;

    // Insert the toggle before the first nav item
    navList.insertBefore(toggleLi, navList.firstChild);

    // Add click event listener
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

// Initialize theme immediately to prevent flash
initTheme();

// Create toggle when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createThemeToggle);
} else {
    createThemeToggle();
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only update if user hasn't set a preference
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}
