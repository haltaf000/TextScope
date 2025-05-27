// Main Application Module
// Initializes the application and sets up event listeners

class TextScopeApp {
    constructor() {
        this.initialized = false;
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
                return;
            }

            console.log('Initializing TextScope application...');

            // Initialize modules in order
            this.setupEventListeners();
            
            // Check if user is already logged in
            if (window.authManager.isAuthenticated()) {
                await window.authManager.fetchUserProfile();
            }
            
            // Update UI state
            window.uiManager.updateUIState();

            this.initialized = true;
            console.log('TextScope application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize TextScope application:', error);
        }
    }

    // Set up all event listeners
    setupEventListeners() {
        // Authentication form listeners
        this.setupAuthListeners();
        
        // Analysis form listeners
        this.setupAnalysisListeners();
        
        // Navigation listeners
        this.setupNavigationListeners();

        // Global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this));
    }

    // Setup authentication event listeners
    setupAuthListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            const form = loginForm.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => window.authManager.login(e));
            }
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            const form = registerForm.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => window.authManager.register(e));
            }
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => window.authManager.logout());
        }

        // Auth navigation buttons
        const showLoginBtn = document.querySelector('[onclick="showLoginForm()"]');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.uiManager.showLoginForm();
            });
        }

        const showRegisterBtn = document.querySelector('[onclick="showRegisterForm()"]');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.uiManager.showRegisterForm();
            });
        }
    }

    // Setup analysis event listeners
    setupAnalysisListeners() {
        // Analysis form
        const analysisForm = document.getElementById('analysisForm');
        if (analysisForm) {
            analysisForm.addEventListener('submit', (e) => window.analysisManager.analyzeText(e));
        }

        // Text input character counter (optional enhancement)
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('input', this.updateCharacterCount.bind(this));
        }
    }

    // Setup navigation event listeners
    setupNavigationListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', this.handlePopState.bind(this));

        // Handle keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    // Update character count for text input
    updateCharacterCount(event) {
        const text = event.target.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        // Find or create counter element
        let counter = document.getElementById('textInputCounter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'textInputCounter';
            counter.className = 'text-xs text-secondary mt-1';
            event.target.parentNode.appendChild(counter);
        }

        counter.textContent = `${charCount} characters, ${wordCount} words`;
    }

    // Handle browser navigation
    handlePopState(event) {
        // Update UI state based on current URL or state
        window.uiManager.updateUIState();
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter to submit analysis form
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            const analysisForm = document.getElementById('analysisForm');
            if (analysisForm && document.activeElement === document.getElementById('textInput')) {
                event.preventDefault();
                analysisForm.dispatchEvent(new Event('submit'));
            }
        }

        // Escape to close modals or details
        if (event.key === 'Escape') {
            // Close any open details sections
            const openDetails = document.querySelectorAll('[id$="Details"]:not(.hidden)');
            openDetails.forEach(detail => detail.classList.add('hidden'));
        }
    }

    // Global error handler
    handleGlobalError(event) {
        console.error('Global error:', event.error);
        
        // Show user-friendly error message
        const errorMessage = 'An unexpected error occurred. Please refresh the page and try again.';
        
        // Try to show error in UI if possible
        const mainContent = document.getElementById('mainContent');
        if (mainContent && !mainContent.classList.contains('hidden')) {
            window.uiManager.showErrorMessage(errorMessage, mainContent);
        } else {
            alert(errorMessage);
        }
    }

    // Utility method to check if all required modules are loaded
    checkModulesLoaded() {
        const requiredModules = [
            'authManager',
            'uiManager', 
            'analysisManager',
            'displayManager',
            'keyPhrasesManager',
            'Utils'
        ];

        const missingModules = requiredModules.filter(module => !window[module]);
        
        if (missingModules.length > 0) {
            console.error('Missing required modules:', missingModules);
            return false;
        }

        return true;
    }

    // Method to reinitialize if needed
    async reinitialize() {
        this.initialized = false;
        await this.init();
    }
}

// Global functions for backward compatibility with inline event handlers
// These will be gradually replaced with proper event listeners

function login(event) {
    return window.authManager.login(event);
}

function register(event) {
    return window.authManager.register(event);
}

function logout() {
    return window.authManager.logout();
}

function analyzeText(event) {
    return window.analysisManager.analyzeText(event);
}

function deleteAnalysis(id) {
    return window.analysisManager.deleteAnalysis(id);
}

function showLoginForm() {
    return window.uiManager.showLoginForm();
}

function showRegisterForm() {
    return window.uiManager.showRegisterForm();
}

function toggleCategoryDetails() {
    return window.uiManager.toggleCategoryDetails();
}

function toggleSummaryDetails() {
    return window.uiManager.toggleSummaryDetails();
}

function toggleSentimentDetails() {
    return window.uiManager.toggleSentimentDetails();
}

function toggleKeyPhrasesDetails() {
    return window.uiManager.toggleKeyPhrasesDetails();
}

function copySummary() {
    return window.uiManager.copySummary();
}

function filterKeyPhrases(category) {
    return window.keyPhrasesManager.filterKeyPhrases(category);
}

function sortKeyPhrases(sortBy) {
    return window.keyPhrasesManager.sortKeyPhrases(sortBy);
}

function toggleAdvancedMetrics(index) {
    return window.keyPhrasesManager.toggleAdvancedMetrics(index);
}

function exportKeyPhrases(format) {
    return window.keyPhrasesManager.exportKeyPhrases(format);
}

function copyKeyPhrases() {
    return window.keyPhrasesManager.copyKeyPhrases();
}

function displayAnalysisResults(result) {
    return window.displayManager.displayAnalysisResults(result);
}

// Initialize the application
const app = new TextScopeApp();

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export app instance for debugging
window.textScopeApp = app; 