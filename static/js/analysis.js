// Analysis Module
// Handles text analysis requests, history management, and analysis operations

class AnalysisManager {
    constructor() {
        this.analysisHistory = [];
    }

    // Analyze text
    async analyzeText(event) {
        event.preventDefault();
        const text = document.getElementById('textInput').value;
        const title = document.getElementById('titleInput').value || "Untitled Analysis";
        const submitButton = event.target.querySelector('button[type="submit"]');
        const form = event.target;
        
        if (!text.trim()) {
            alert('Please enter some text to analyze.');
            return;
        }

        try {
            // Disable the form and show loading state
            submitButton.disabled = true;
            form.classList.add('opacity-50');
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
            
            console.log('Sending analysis request...');
            const response = await fetch('/analyze/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.authManager.getToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, title }),
            });

            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response text:', responseText);

            if (response.ok) {
                try {
                    const result = JSON.parse(responseText);
                    console.log('Full analysis result:', JSON.stringify(result, null, 2));
                    
                    // Update the UI with the new analysis
                    window.uiManager.setCurrentAnalysisData(result);
                    window.displayManager.displayAnalysisResults(result);
                    
                    // Clear the form
                    form.reset();
                    
                    // Refresh the history
                    await this.loadAnalysisHistory();
                    
                    // Show success message
                    window.uiManager.showSuccessMessage('Analysis completed successfully!', form);
                    
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    console.error('Raw response:', responseText);
                    throw new Error('Failed to parse analysis results');
                }
            } else {
                let errorMessage = 'Analysis failed. Please try again.';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.detail || errorMessage;
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                console.error('Analysis failed:', errorMessage);
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            alert('An error occurred during analysis. Please try again.');
        } finally {
            // Re-enable the form
            submitButton.disabled = false;
            form.classList.remove('opacity-50');
            submitButton.innerHTML = 'Analyze Text';
        }
    }

    // Load analysis history
    async loadAnalysisHistory() {
        try {
            const response = await fetch('/analyses/', {
                headers: {
                    'Authorization': `Bearer ${window.authManager.getToken()}`,
                },
            });

            if (response.ok) {
                this.analysisHistory = await response.json();
                window.displayManager.displayAnalysisHistory(this.analysisHistory);
            } else {
                console.error('Failed to load analysis history');
            }
        } catch (error) {
            console.error('Error loading analysis history:', error);
        }
    }

    // Delete analysis
    async deleteAnalysis(id) {
        if (!confirm('Are you sure you want to delete this analysis?')) {
            return;
        }

        try {
            const response = await fetch(`/analyses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${window.authManager.getToken()}`,
                },
            });

            if (response.ok) {
                // Remove from local array
                this.analysisHistory = this.analysisHistory.filter(analysis => analysis.id !== id);
                
                // Update the display
                window.displayManager.displayAnalysisHistory(this.analysisHistory);
                
                // Show success message
                const historyContainer = document.getElementById('analysisHistory');
                if (historyContainer) {
                    window.uiManager.showSuccessMessage('Analysis deleted successfully!', historyContainer);
                }
            } else {
                alert('Failed to delete analysis. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting analysis:', error);
            alert('An error occurred while deleting the analysis.');
        }
    }

    // Get analysis history
    getAnalysisHistory() {
        return this.analysisHistory;
    }

    // Load specific analysis
    async loadAnalysis(id) {
        try {
            const response = await fetch(`/analyses/${id}`, {
                headers: {
                    'Authorization': `Bearer ${window.authManager.getToken()}`,
                },
            });

            if (response.ok) {
                const analysis = await response.json();
                window.uiManager.setCurrentAnalysisData(analysis);
                window.displayManager.displayAnalysisResults(analysis);
                return analysis;
            } else {
                console.error('Failed to load analysis');
                return null;
            }
        } catch (error) {
            console.error('Error loading analysis:', error);
            return null;
        }
    }
}

// Export for global use
window.analysisManager = new AnalysisManager(); 