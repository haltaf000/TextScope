// Authentication Module
// Handles login, registration, logout, and user profile management

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentUser = null;
    }

    // Get current token
    getToken() {
        return this.token;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Login function
    async login(event) {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitButton = event.target.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
            
            const response = await fetch('/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.access_token;
                localStorage.setItem('token', this.token);
                await this.fetchUserProfile();
                window.uiManager.updateUIState();
                return true;
            } else {
                alert('Login failed. Please check your credentials.');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login.');
            return false;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Sign In';
        }
    }

    // Register function
    async register(event) {
        event.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const submitButton = event.target.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...';
            
            const response = await fetch('/users/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password }),
            });

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.uiManager.showLoginForm();
                return true;
            } else {
                const error = await response.json();
                alert(`Registration failed: ${error.detail}`);
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration.');
            return false;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Create Account';
        }
    }

    // Logout function
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        window.uiManager.updateUIState();
    }

    // Fetch user profile
    async fetchUserProfile() {
        try {
            const response = await fetch('/users/me/', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                this.currentUser = await response.json();
                return this.currentUser;
            } else {
                this.logout();
                return null;
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            this.logout();
            return null;
        }
    }
}

// Export for global use
window.authManager = new AuthManager(); 