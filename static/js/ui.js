// UI Management Module
// Handles UI state management, navigation, and form switching

class UIManager {
    constructor() {
        this.currentAnalysisData = null;
    }

    // Update UI state based on authentication status
    updateUIState() {
        const userSection = document.getElementById('userSection');
        const authSection = document.getElementById('authSection');
        const mainContent = document.getElementById('mainContent');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const landingPage = document.getElementById('landingPage');

        if (window.authManager.isAuthenticated()) {
            // Logged in state
            userSection.classList.remove('hidden');
            authSection.classList.add('hidden');
            mainContent.classList.remove('hidden');
            loginForm.classList.add('hidden');
            registerForm.classList.add('hidden');
            landingPage.classList.add('hidden');
            
            const currentUser = window.authManager.getCurrentUser();
            document.getElementById('username').textContent = currentUser?.username || '';
            window.analysisManager.loadAnalysisHistory();
        } else {
            // Logged out state
            userSection.classList.add('hidden');
            authSection.classList.remove('hidden');
            mainContent.classList.add('hidden');
            landingPage.classList.remove('hidden');
        }
    }

    // Show login form
    showLoginForm() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    }

    // Show register form
    showRegisterForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
    }

    // Set current analysis data
    setCurrentAnalysisData(data) {
        this.currentAnalysisData = data;
    }

    // Get current analysis data
    getCurrentAnalysisData() {
        return this.currentAnalysisData;
    }

    // Toggle category details
    toggleCategoryDetails() {
        const details = document.getElementById('categoryDetails');
        if (details) {
            details.classList.toggle('hidden');
        }
    }

    // Toggle summary details
    toggleSummaryDetails() {
        const details = document.getElementById('summaryDetails');
        if (details) {
            details.classList.toggle('hidden');
        }
    }

    // Toggle sentiment details
    toggleSentimentDetails() {
        const details = document.getElementById('sentimentDetails');
        if (details) {
            details.classList.toggle('hidden');
        }
    }

    // Toggle key phrases details
    toggleKeyPhrasesDetails() {
        const details = document.getElementById('keyPhrasesDetails');
        if (details) {
            details.classList.toggle('hidden');
        }
    }

    // Copy summary to clipboard
    copySummary() {
        const summaryElement = document.querySelector('#summaryResult p');
        if (summaryElement) {
            const summary = summaryElement.textContent;
            navigator.clipboard.writeText(summary).then(() => {
                // Show a temporary success message
                const button = document.querySelector('#summaryResult button:last-child');
                if (button) {
                    const originalIcon = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        button.innerHTML = originalIcon;
                    }, 2000);
                }
            });
        }
    }

    // Show success message
    showSuccessMessage(message, container) {
        const successMessage = document.createElement('div');
        successMessage.className = 'text-green-600 text-sm mt-2';
        successMessage.textContent = message;
        container.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    }

    // Show error message
    showErrorMessage(message, container) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'text-red-600 text-sm mt-2';
        errorMessage.textContent = message;
        container.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 5000);
    }

    // Show loading state
    showLoadingState(button, loadingText = 'Loading...') {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
    }

    // Hide loading state
    hideLoadingState(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Export for global use
window.uiManager = new UIManager(); 